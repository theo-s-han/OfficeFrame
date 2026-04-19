import { defaultGanttPalette } from "@/lib/gantt/theme";
import {
  readTimelineDebugEnabled,
  recordTimelineDebugEvent,
} from "@/lib/timeline/debug";
import {
  getTimelinePreviewVisualSize,
  hasVisibleTimelinePreviewNodes,
} from "@/lib/timeline/previewMetrics";
import {
  exportPreviewSurfaceImage,
  type PreviewExportSize,
} from "@/lib/shared/previewExport";

const TIMELINE_EXPORT_PADDING = 24;

export type TimelineExportMetrics = {
  measurableNodeCount: number;
  outputSize: PreviewExportSize;
  renderSize: PreviewExportSize;
  totalNodeCount: number;
  zoom: number;
};

export type TimelineExportNodeMetrics = {
  measurableNodeCount: number;
  totalNodeCount: number;
};

export type TimelineExportDebugPhase =
  | "initial"
  | "before-prepare"
  | "prepared"
  | "complete"
  | "error";

type TimelineExportRectSnapshot = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

export type TimelineExportElementSnapshot = {
  ariaLabel: string | null;
  className: string;
  clientHeight: number;
  clientWidth: number;
  dataTestId: string | null;
  maxHeight: string;
  opacity: string;
  overflowX: string;
  overflowY: string;
  rect: TimelineExportRectSnapshot;
  scrollHeight: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
  tagName: string;
  transform: string;
  visibility: string;
};

export type TimelineExportNodeSnapshot = {
  index: number;
  measurable: boolean;
  relativeRect: TimelineExportRectSnapshot;
  textSample: string;
};

export type TimelineExportDebugSnapshot = {
  hasVisibleNodes: boolean;
  metrics: TimelineExportMetrics;
  nodeSummary: {
    clippedHorizontalCount: number;
    clippedVerticalCount: number;
    firstHorizontalClippedNode: TimelineExportNodeSnapshot | null;
    firstHiddenNode: TimelineExportNodeSnapshot | null;
    firstVerticalClippedNode: TimelineExportNodeSnapshot | null;
    lowestNode: TimelineExportNodeSnapshot | null;
    measurableNodeCount: number;
    rightmostNode: TimelineExportNodeSnapshot | null;
    totalNodeCount: number;
  };
  overflowSummary: {
    contentHeight: number;
    contentWidth: number;
    heightDelta: number;
    targetRectHeight: number;
    targetRectWidth: number;
    widthDelta: number;
  };
  phase: TimelineExportDebugPhase;
  scrollport: TimelineExportElementSnapshot | null;
  source: TimelineExportElementSnapshot;
  target: TimelineExportElementSnapshot;
  zoomStage: TimelineExportElementSnapshot | null;
};

type TimelineExportStylePatch = Partial<
  Pick<
    CSSStyleDeclaration,
    | "animation"
    | "height"
    | "maxHeight"
    | "minHeight"
    | "minWidth"
    | "opacity"
    | "overflow"
    | "overflowX"
    | "overflowY"
    | "visibility"
    | "width"
  >
>;

type TimelineExportStyleSnapshot = {
  element: HTMLElement;
  values: Record<string, string>;
};

const TIMELINE_EXPORT_FORCE_VISIBLE_SELECTOR = [
  '[data-testid="vertical-item-row"]',
  ".vertical-item-row",
  ".timeline-horz-item-container",
  ".timeline-horizontal-item",
  ".timeline-point-section",
  ".timeline-title-section",
  ".timeline-card-section",
  ".card-content-wrapper",
  ".chrono-card",
  ".chrono-card-content",
  ".timeline-card-content",
  ".timeline-preview-card",
  ".timeline-preview-title",
  ".timeline-item-content",
].join(", ");

const TIMELINE_EXPORT_EXPAND_LAYOUT_SELECTOR = [
  ".timeline-preview-surface",
  ".timeline-preview-scrollport",
  ".timeline-preview-zoom-shell",
  ".timeline-preview-zoom-stage",
  ".timeline-wrapper",
  '[data-testid="timeline-main-wrapper"]',
  '[data-testid="vertical-item-row"]',
  ".vertical-item-row",
  ".timeline-horz-item-container",
  ".timeline-horizontal-item",
  ".chrono-card-content",
  ".card-content-wrapper",
].join(", ");

const TIMELINE_EXPORT_DIMENSION_SELECTOR = [
  ".timeline-preview-surface",
  ".timeline-preview-scrollport",
  ".timeline-preview-zoom-shell",
  ".timeline-preview-zoom-stage",
  ".timeline-wrapper",
  '[data-testid="timeline-main-wrapper"]',
].join(", ");

const TIMELINE_EXPORT_NODE_SELECTOR = ".timeline-item-content";
const TIMELINE_EXPORT_CLIP_TOLERANCE = 1;

export function getTimelineExportElement(source: HTMLElement) {
  return (
    source.querySelector<HTMLElement>(".timeline-preview-surface") ??
    source.querySelector<HTMLElement>(".timeline-preview-scrollport") ??
    source.querySelector<HTMLElement>(".timeline-preview-zoom-shell") ??
    source.querySelector<HTMLElement>(".timeline-preview-zoom-stage") ??
    source
  );
}

export function getTimelineExportSize(target: HTMLElement): PreviewExportSize {
  return getTimelineExportMetrics(target).outputSize;
}

function isMeasurableTimelineExportNode(node: HTMLElement) {
  const style = window.getComputedStyle(node);

  if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") {
    return false;
  }

  const rect = node.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

export function getTimelineExportNodeMetrics(
  target: HTMLElement,
): TimelineExportNodeMetrics {
  const nodes = Array.from(
    target.querySelectorAll<HTMLElement>(TIMELINE_EXPORT_NODE_SELECTOR),
  );

  return {
    totalNodeCount: nodes.length,
    measurableNodeCount: nodes.filter((node) => isMeasurableTimelineExportNode(node)).length,
  };
}

function createRectSnapshot(rect: DOMRect | DOMRectReadOnly): TimelineExportRectSnapshot {
  return {
    width: Math.max(0, Math.ceil(rect.width)),
    height: Math.max(0, Math.ceil(rect.height)),
    top: Math.floor(rect.top),
    left: Math.floor(rect.left),
    right: Math.ceil(rect.right),
    bottom: Math.ceil(rect.bottom),
  };
}

function createElementSnapshot(element: HTMLElement | null): TimelineExportElementSnapshot | null {
  if (!element) {
    return null;
  }

  const style = window.getComputedStyle(element);

  return {
    tagName: element.tagName.toLowerCase(),
    className: element.className,
    dataTestId: element.getAttribute("data-testid"),
    ariaLabel: element.getAttribute("aria-label"),
    rect: createRectSnapshot(element.getBoundingClientRect()),
    scrollWidth: element.scrollWidth,
    scrollHeight: element.scrollHeight,
    clientWidth: element.clientWidth,
    clientHeight: element.clientHeight,
    scrollLeft: element.scrollLeft,
    scrollTop: element.scrollTop,
    overflowX: style.overflowX,
    overflowY: style.overflowY,
    visibility: style.visibility,
    opacity: style.opacity,
    maxHeight: style.maxHeight,
    transform: style.transform,
  };
}

function createNodeSnapshot(
  node: HTMLElement,
  targetRect: DOMRect | DOMRectReadOnly,
  index: number,
): TimelineExportNodeSnapshot {
  const rect = node.getBoundingClientRect();

  return {
    index,
    measurable: isMeasurableTimelineExportNode(node),
    textSample: node.textContent?.trim().replace(/\s+/g, " ").slice(0, 80) ?? "",
    relativeRect: {
      width: Math.max(0, Math.ceil(rect.width)),
      height: Math.max(0, Math.ceil(rect.height)),
      top: Math.floor(rect.top - targetRect.top),
      left: Math.floor(rect.left - targetRect.left),
      right: Math.ceil(rect.right - targetRect.left),
      bottom: Math.ceil(rect.bottom - targetRect.top),
    },
  };
}

function getTimelinePreviewZoom(target: HTMLElement) {
  const stage = target.matches(".timeline-preview-zoom-stage")
    ? target
    : target.querySelector<HTMLElement>(".timeline-preview-zoom-stage");

  if (!stage) {
    return 1;
  }

  const zoomValue =
    window.getComputedStyle(stage).getPropertyValue("--timeline-preview-zoom") ||
    stage.style.getPropertyValue("--timeline-preview-zoom");
  const parsedZoom = Number.parseFloat(zoomValue.trim());

  if (Number.isFinite(parsedZoom) && parsedZoom > 0) {
    return parsedZoom;
  }

  const transformMatch = stage.style.transform.match(/scale\(([^)]+)\)/);
  const parsedTransformZoom = Number.parseFloat(transformMatch?.[1] ?? "");

  if (Number.isFinite(parsedTransformZoom) && parsedTransformZoom > 0) {
    return parsedTransformZoom;
  }

  return 1;
}

export function getTimelineExportRenderSize(
  target: HTMLElement,
): PreviewExportSize {
  return getTimelineExportMetrics(target).renderSize;
}

export function getTimelineExportMetrics(
  target: HTMLElement,
): TimelineExportMetrics {
  const nodeMetrics = getTimelineExportNodeMetrics(target);

  if (!hasVisibleTimelinePreviewNodes(target)) {
    return {
      ...nodeMetrics,
      zoom: 1,
      outputSize: {
        width: 0,
        height: 0,
      },
      renderSize: {
        width: 0,
        height: 0,
      },
    };
  }

  const zoom = getTimelinePreviewZoom(target);
  const size = getTimelinePreviewVisualSize(target);
  const paddedOutputSize = {
    width: size.width + TIMELINE_EXPORT_PADDING,
    height: size.height + TIMELINE_EXPORT_PADDING,
  };

  return {
    ...nodeMetrics,
    zoom,
    outputSize: paddedOutputSize,
    renderSize: {
      width: Math.max(1, Math.ceil(paddedOutputSize.width / zoom)),
      height: Math.max(1, Math.ceil(paddedOutputSize.height / zoom)),
    },
  };
}

export function createTimelineExportDebugSnapshot(
  source: HTMLElement,
  phase: TimelineExportDebugPhase,
  target = getTimelineExportElement(source),
): TimelineExportDebugSnapshot {
  const scrollport =
    source.querySelector<HTMLElement>(".timeline-preview-scrollport");
  const zoomStage = source.querySelector<HTMLElement>(".timeline-preview-zoom-stage");
  const hasVisibleNodes = hasVisibleTimelinePreviewNodes(target);
  const previewVisualSize = hasVisibleNodes
    ? getTimelinePreviewVisualSize(target)
    : { width: 0, height: 0 };
  const metrics = getTimelineExportMetrics(target);
  const targetRect = target.getBoundingClientRect();
  const nodeSnapshots = Array.from(
    target.querySelectorAll<HTMLElement>(TIMELINE_EXPORT_NODE_SELECTOR),
  ).map((node, index) => createNodeSnapshot(node, targetRect, index));
  const hiddenNodes = nodeSnapshots.filter((node) => !node.measurable);
  const clippedVerticalNodes = nodeSnapshots.filter(
    (node) => node.relativeRect.bottom > Math.ceil(targetRect.height) + TIMELINE_EXPORT_CLIP_TOLERANCE,
  );
  const clippedHorizontalNodes = nodeSnapshots.filter(
    (node) => node.relativeRect.right > Math.ceil(targetRect.width) + TIMELINE_EXPORT_CLIP_TOLERANCE,
  );
  const lowestNode = [...nodeSnapshots].sort(
    (left, right) => right.relativeRect.bottom - left.relativeRect.bottom,
  )[0] ?? null;
  const rightmostNode = [...nodeSnapshots].sort(
    (left, right) => right.relativeRect.right - left.relativeRect.right,
  )[0] ?? null;

  return {
    phase,
    hasVisibleNodes,
    metrics,
    source: createElementSnapshot(source)!,
    target: createElementSnapshot(target)!,
    scrollport: createElementSnapshot(scrollport),
    zoomStage: createElementSnapshot(zoomStage),
    overflowSummary: {
      targetRectWidth: Math.max(0, Math.ceil(targetRect.width)),
      targetRectHeight: Math.max(0, Math.ceil(targetRect.height)),
      contentWidth: previewVisualSize.width,
      contentHeight: previewVisualSize.height,
      widthDelta: Math.max(0, previewVisualSize.width - Math.ceil(targetRect.width)),
      heightDelta: Math.max(0, previewVisualSize.height - Math.ceil(targetRect.height)),
    },
    nodeSummary: {
      totalNodeCount: nodeSnapshots.length,
      measurableNodeCount: nodeSnapshots.filter((node) => node.measurable).length,
      clippedVerticalCount: clippedVerticalNodes.length,
      clippedHorizontalCount: clippedHorizontalNodes.length,
      firstHiddenNode: hiddenNodes[0] ?? null,
      firstVerticalClippedNode: clippedVerticalNodes[0] ?? null,
      firstHorizontalClippedNode: clippedHorizontalNodes[0] ?? null,
      lowestNode,
      rightmostNode,
    },
  };
}

function recordTimelineExportDebugSnapshot(
  source: HTMLElement,
  phase: TimelineExportDebugPhase,
  enabled: boolean,
  extraPayload?: Record<string, unknown>,
  target?: HTMLElement,
) {
  if (!enabled) {
    return null;
  }

  return recordTimelineDebugEvent(
    `timeline.export.${phase}`,
    {
      ...createTimelineExportDebugSnapshot(
        source,
        phase,
        target ?? getTimelineExportElement(source),
      ),
      ...extraPayload,
    },
    enabled,
  );
}

function snapshotElementStyles(
  element: HTMLElement,
  properties: Array<keyof TimelineExportStylePatch>,
): TimelineExportStyleSnapshot {
  return {
    element,
    values: Object.fromEntries(
      properties.map((property) => [property, element.style[property] ?? ""]),
    ),
  };
}

function applyElementStylePatch(
  element: HTMLElement,
  patch: TimelineExportStylePatch,
) {
  Object.entries(patch).forEach(([property, value]) => {
    if (value != null) {
      element.style[property as keyof TimelineExportStylePatch] = value;
    }
  });
}

function restoreElementStyles(snapshot: TimelineExportStyleSnapshot) {
  Object.entries(snapshot.values).forEach(([property, value]) => {
    snapshot.element.style[property as keyof TimelineExportStylePatch] = value;
  });
}

async function waitForTimelineExportLayout(frames = 2) {
  for (let index = 0; index < frames; index += 1) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }
}

export async function prepareTimelineExportTarget(
  target: HTMLElement,
  source: HTMLElement,
) {
  const scrollport =
    source.querySelector<HTMLElement>(".timeline-preview-scrollport");
  const styleSnapshots: TimelineExportStyleSnapshot[] = [];
  const visibilityTargets = [
    ...source.querySelectorAll<HTMLElement>(TIMELINE_EXPORT_FORCE_VISIBLE_SELECTOR),
  ];
  const layoutTargets = [
    ...source.querySelectorAll<HTMLElement>(TIMELINE_EXPORT_EXPAND_LAYOUT_SELECTOR),
  ];
  const dimensionTargets = [
    ...source.querySelectorAll<HTMLElement>(TIMELINE_EXPORT_DIMENSION_SELECTOR),
  ];

  visibilityTargets.forEach((element) => {
    styleSnapshots.push(
      snapshotElementStyles(element, ["animation", "opacity", "visibility"]),
    );
    applyElementStylePatch(element, {
      animation: "none",
      opacity: "1",
      visibility: "visible",
    });
  });

  layoutTargets.forEach((element) => {
    styleSnapshots.push(
      snapshotElementStyles(element, [
        "height",
        "maxHeight",
        "minHeight",
        "overflow",
        "overflowX",
        "overflowY",
      ]),
    );
    applyElementStylePatch(element, {
      height: "auto",
      maxHeight: "none",
      overflow: "visible",
      overflowX: "visible",
      overflowY: "visible",
    });
  });

  const metrics = getTimelineExportMetrics(target);
  if (metrics.outputSize.width > 1 && metrics.outputSize.height > 1) {
    const explicitWidth = `${Math.max(1, metrics.renderSize.width)}px`;
    const explicitHeight = `${Math.max(1, metrics.renderSize.height)}px`;

    dimensionTargets.forEach((element) => {
      styleSnapshots.push(
        snapshotElementStyles(element, [
          "height",
          "maxHeight",
          "minHeight",
          "minWidth",
          "width",
        ]),
      );
      applyElementStylePatch(element, {
        height: explicitHeight,
        maxHeight: "none",
        minHeight: explicitHeight,
        minWidth: explicitWidth,
        width: explicitWidth,
      });
    });
  }

  if (!scrollport) {
    await waitForTimelineExportLayout();

    return () => {
      styleSnapshots.reverse().forEach((snapshot) => restoreElementStyles(snapshot));
    };
  }

  const previousScrollLeft = scrollport.scrollLeft;
  const previousScrollTop = scrollport.scrollTop;

  scrollport.scrollLeft = 0;
  scrollport.scrollTop = 0;

  await waitForTimelineExportLayout();

  return () => {
    scrollport.scrollLeft = previousScrollLeft;
    scrollport.scrollTop = previousScrollTop;
    styleSnapshots.reverse().forEach((snapshot) => restoreElementStyles(snapshot));
  };
}

export async function exportTimelinePreviewImage(source: HTMLElement) {
  const debugEnabled = readTimelineDebugEnabled();

  recordTimelineExportDebugSnapshot(source, "initial", debugEnabled);

  try {
    const dataUrl = await exportPreviewSurfaceImage(source, {
      backgroundColor: defaultGanttPalette.neutral.background,
      getRenderSize: getTimelineExportRenderSize,
      getSize: getTimelineExportSize,
      getTarget: getTimelineExportElement,
      prepareTarget: async (target, currentSource) => {
        recordTimelineExportDebugSnapshot(
          currentSource,
          "before-prepare",
          debugEnabled,
          undefined,
          target,
        );

        const cleanup = await prepareTimelineExportTarget(target, currentSource);

        recordTimelineExportDebugSnapshot(
          currentSource,
          "prepared",
          debugEnabled,
          undefined,
          target,
        );

        return cleanup;
      },
      skipFonts: true,
    });

    recordTimelineExportDebugSnapshot(source, "complete", debugEnabled, {
      dataUrlLength: dataUrl.length,
    });

    return dataUrl;
  } catch (error) {
    recordTimelineExportDebugSnapshot(source, "error", debugEnabled, {
      message: error instanceof Error ? error.message : "unknown export error",
    });
    throw error;
  }
}
