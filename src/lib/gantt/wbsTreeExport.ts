import { toPng } from "html-to-image";
import {
  renderProjectPreviewExportModel,
  type ProjectPreviewExportModel,
} from "./projectPreviewExport";
import {
  inlineSvgPresentationStyles,
  stabilizeSvgAnimations,
} from "./svgExport";
import { defaultGanttPalette } from "./theme";
import {
  defaultWbsTreeExportPadding,
  getWbsTreeContentExportFrame,
  getWbsTreeExportFrame,
} from "./wbsTreePreviewLayout";

type WbsTreePreviewExportOptions = Parameters<
  typeof renderProjectPreviewExportModel
>[1] & {
  toPngImpl?: typeof toPng;
};

function createSvgDataUrl(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function getElementBackgroundColor(element?: Element | null): string {
  if (!element) {
    return defaultGanttPalette.neutral.background;
  }

  const { backgroundColor } = window.getComputedStyle(element);

  if (
    !backgroundColor ||
    backgroundColor === "transparent" ||
    backgroundColor === "rgba(0, 0, 0, 0)"
  ) {
    return defaultGanttPalette.neutral.background;
  }

  return backgroundColor;
}

function getWbsPreviewSurface(source: HTMLElement): HTMLElement | null {
  if (source.matches(".wbs-tree-surface")) {
    return source;
  }

  return (
    source.querySelector<HTMLElement>(".typed-gantt-wbs .wbs-tree-surface") ??
    source.querySelector<HTMLElement>(".wbs-tree-surface")
  );
}

function getWbsPreviewSvg(source: HTMLElement): SVGSVGElement | null {
  const surface = getWbsPreviewSurface(source);

  if (surface) {
    const directSvg = surface.querySelector<SVGSVGElement>("svg");

    if (directSvg) {
      return directSvg;
    }
  }

  return source.querySelector<SVGSVGElement>(".wbs-tree-surface svg");
}

async function waitForDocumentFontsReady() {
  if (typeof document === "undefined" || !("fonts" in document)) {
    return;
  }

  try {
    await document.fonts.ready;
  } catch {
    // Ignore font readiness failures and continue with the current DOM.
  }
}

async function waitForWbsPreviewReady(
  source: HTMLElement,
  timeoutMs = 1500,
): Promise<{
  surface: HTMLElement;
  svg: SVGSVGElement;
}> {
  const startedAt = window.performance.now();

  while (window.performance.now() - startedAt < timeoutMs) {
    const surface = getWbsPreviewSurface(source);
    const svg = getWbsPreviewSvg(source);

    if (surface && svg) {
      const surfaceRect = surface.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();

      if (
        surfaceRect.width > 1 &&
        surfaceRect.height > 1 &&
        svgRect.width > 1 &&
        svgRect.height > 1
      ) {
        return {
          surface,
          svg,
        };
      }
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  throw new Error("wbs tree preview svg not found");
}

function appendWbsSvgTextExportStyle(svg: SVGSVGElement) {
  const styleElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "style",
  );

  styleElement.textContent = `
    .wbs-tree-node-title,
    .wbs-tree-node-meta,
    .wbs-tree-node-kind,
    .wbs-tree-node-owner,
    .wbs-tree-status-text,
    .wbs-tree-node-notes,
    text,
    tspan {
      font-family: "Segoe UI", "Noto Sans KR", "Apple SD Gothic Neo", Arial, system-ui, sans-serif;
      font-synthesis: none;
      paint-order: normal;
      stroke: none;
      stroke-width: 0;
      text-rendering: optimizeLegibility;
      letter-spacing: 0;
    }
  `;

  svg.prepend(styleElement);
}

function getWbsTreeGroup(svg: SVGSVGElement): SVGGElement | null {
  return (
    svg.querySelector<SVGGElement>(".rd3t-g") ??
    svg.querySelector<SVGGElement>("g")
  );
}

function setWbsTreeExportTransform(
  treeGroup: SVGGElement,
  transform: {
    scale: number;
    x: number;
    y: number;
  },
) {
  treeGroup.setAttribute(
    "transform",
    `translate(${transform.x},${transform.y}) scale(${transform.scale})`,
  );
  treeGroup.style.removeProperty("transform");
}

function measureWbsTreeContentBounds(treeGroup: SVGGElement) {
  if (typeof treeGroup.getBBox !== "function") {
    return null;
  }

  try {
    const bounds = treeGroup.getBBox();

    if (
      !Number.isFinite(bounds.x) ||
      !Number.isFinite(bounds.y) ||
      !Number.isFinite(bounds.width) ||
      !Number.isFinite(bounds.height) ||
      bounds.width <= 0 ||
      bounds.height <= 0
    ) {
      return null;
    }

    return {
      height: bounds.height,
      width: bounds.width,
      x: bounds.x,
      y: bounds.y,
    };
  } catch {
    return null;
  }
}

function createSurfaceCaptureOptions(
  width: number,
  height: number,
  background: string,
  pixelRatio: number,
) {
  return {
    cacheBust: true,
    backgroundColor: background,
    pixelRatio,
    width,
    height,
    style: {
      margin: "0",
      backgroundColor: background,
      width: `${width}px`,
      height: `${height}px`,
      minHeight: `${height}px`,
      maxHeight: `${height}px`,
    },
  };
}

type PreparedWbsExportTarget = {
  background: string;
  cleanup: () => void;
  height: number;
  node: HTMLElement;
  svg: SVGSVGElement;
  trailingPadding: {
    bottom: number;
    right: number;
  };
  width: number;
};

function prepareWbsTreeExportTarget(
  source: HTMLElement,
): PreparedWbsExportTarget {
  const surface = getWbsPreviewSurface(source);
  const svg = getWbsPreviewSvg(source);

  if (!surface || !svg) {
    throw new Error("wbs tree preview svg not found");
  }

  const surfaceRect = surface.getBoundingClientRect();
  const background = getElementBackgroundColor(surface);
  const shell = document.createElement("div");
  const captureRoot = document.createElement("div");
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
  const sourceTreeGroup = getWbsTreeGroup(svg);
  let width = Math.max(1, Math.ceil(surfaceRect.width));
  let height = Math.max(
    1,
    Math.ceil(surfaceRect.height + defaultWbsTreeExportPadding.bottom),
  );
  let trailingPadding = {
    bottom: defaultWbsTreeExportPadding.bottom,
    right: defaultWbsTreeExportPadding.right,
  };

  shell.style.position = "fixed";
  shell.style.left = "-100000px";
  shell.style.top = "0";
  shell.style.zIndex = "-1";
  shell.style.pointerEvents = "none";
  shell.style.overflow = "hidden";
  shell.style.background = background;
  shell.style.visibility = "hidden";

  captureRoot.style.overflow = "hidden";
  captureRoot.style.background = background;

  captureRoot.appendChild(clonedSvg);
  shell.appendChild(captureRoot);
  document.body.appendChild(shell);

  inlineSvgPresentationStyles(source, shell);
  stabilizeSvgAnimations(shell);
  appendWbsSvgTextExportStyle(clonedSvg);

  const treeGroup = getWbsTreeGroup(clonedSvg);

  if (sourceTreeGroup && treeGroup) {
    const contentBounds = measureWbsTreeContentBounds(sourceTreeGroup);

    if (contentBounds) {
      const frame = getWbsTreeContentExportFrame(contentBounds);

      setWbsTreeExportTransform(treeGroup, frame.transform);
      width = frame.width;
      height = frame.height;
      trailingPadding = frame.trailingPadding;
    } else {
      const svgRect = svg.getBoundingClientRect();
      const fallbackFrame = getWbsTreeExportFrame(surfaceRect, svgRect);

      width = fallbackFrame.width;
      height = fallbackFrame.height;
      trailingPadding = fallbackFrame.trailingPadding;
    }
  }

  shell.style.width = `${width}px`;
  shell.style.height = `${height}px`;
  captureRoot.style.width = `${width}px`;
  captureRoot.style.height = `${height}px`;
  captureRoot.style.maxWidth = `${width}px`;
  captureRoot.style.maxHeight = `${height}px`;
  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", `${width}`);
  clonedSvg.setAttribute("height", `${height}`);
  clonedSvg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  clonedSvg.style.width = `${width}px`;
  clonedSvg.style.height = `${height}px`;
  clonedSvg.style.background = "transparent";

  return {
    background,
    cleanup: () => shell.remove(),
    height,
    node: captureRoot,
    svg: clonedSvg,
    trailingPadding,
    width,
  };
}

export function buildWbsTreePreviewExportModel(
  source: HTMLElement,
): ProjectPreviewExportModel {
  const preparedTarget = prepareWbsTreeExportTarget(source);

  try {
    const svgMarkup = new XMLSerializer().serializeToString(preparedTarget.svg);

    return {
      width: preparedTarget.width,
      height: preparedTarget.height,
      background: preparedTarget.background,
      svgDataUrl: createSvgDataUrl(svgMarkup),
      svgX: 0,
      svgY: 0,
      svgWidth: preparedTarget.width,
      svgHeight: preparedTarget.height,
      trailingPadding: preparedTarget.trailingPadding,
      overlays: [],
    };
  } finally {
    preparedTarget.cleanup();
  }
}

export async function exportWbsTreePreviewImage(
  source: HTMLElement,
  options?: WbsTreePreviewExportOptions,
): Promise<string> {
  await waitForWbsPreviewReady(source);

  await waitForDocumentFontsReady();

  try {
    const model = buildWbsTreePreviewExportModel(source);

    return await renderProjectPreviewExportModel(model, options);
  } catch {
    const preparedTarget = prepareWbsTreeExportTarget(source);
    const pixelRatio = options?.pixelRatio ?? 2;
    const toPngImpl = options?.toPngImpl ?? toPng;
    try {
      return await toPngImpl(
        preparedTarget.node,
        createSurfaceCaptureOptions(
          preparedTarget.width,
          preparedTarget.height,
          preparedTarget.background,
          pixelRatio,
        ),
      );
    } finally {
      preparedTarget.cleanup();
    }
  }
}
