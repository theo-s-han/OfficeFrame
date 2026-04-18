import { defaultGanttPalette } from "./theme";
import {
  inlineSvgPresentationStyles,
  stabilizeSvgAnimations,
} from "./svgExport";

type ProjectPreviewExportTextOverlay = {
  type: "text";
  color: string;
  font: string;
  maxWidth?: number;
  text: string;
  x: number;
  y: number;
};

type ProjectPreviewExportRectOverlay = {
  type: "rect";
  fill: string;
  height: number;
  radius?: number;
  width: number;
  x: number;
  y: number;
};

type ProjectPreviewExportCircleOverlay = {
  type: "circle";
  fill: string;
  radius: number;
  x: number;
  y: number;
};

export type ProjectPreviewExportOverlay =
  | ProjectPreviewExportTextOverlay
  | ProjectPreviewExportRectOverlay
  | ProjectPreviewExportCircleOverlay;

export type ProjectPreviewExportModel = {
  background: string;
  height: number;
  overlays: ProjectPreviewExportOverlay[];
  svgDataUrl: string;
  svgHeight: number;
  svgWidth: number;
  svgX: number;
  svgY: number;
  width: number;
};

type ProjectPreviewExportSize = {
  height: number;
  width: number;
};

type ProjectPreviewExportBounds = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

type ProjectPreviewExportCanvasLike = {
  getContext: (
    contextId: "2d",
  ) => ProjectPreviewExportCanvasRenderingContextLike | null;
  height: number;
  style?: {
    height?: string;
    width?: string;
  };
  toDataURL: (type?: string) => string;
  width: number;
};

type ProjectPreviewExportCanvasRenderingContextLike = {
  arc: (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ) => void;
  beginPath: () => void;
  drawImage: (
    image: CanvasImageSource,
    arg1: number,
    arg2: number,
    arg3: number,
    arg4: number,
    arg5?: number,
    arg6?: number,
    arg7?: number,
    arg8?: number,
  ) => void;
  fill: () => void;
  fillRect: (x: number, y: number, width: number, height: number) => void;
  fillStyle: string;
  fillText: (text: string, x: number, y: number, maxWidth?: number) => void;
  font: string;
  getImageData?: (
    sx: number,
    sy: number,
    sw: number,
    sh: number,
  ) => { data: Uint8ClampedArray };
  restore: () => void;
  roundRect: (
    x: number,
    y: number,
    width: number,
    height: number,
    radii: number,
  ) => void;
  save: () => void;
  scale: (x: number, y: number) => void;
  stroke: () => void;
  strokeStyle: string;
};

type ProjectPreviewExportRgbColor = {
  blue: number;
  green: number;
  red: number;
};

function getExportRect(
  element: Element,
  rootRect: Pick<ProjectPreviewExportBounds, "left" | "top">,
): {
  height: number;
  width: number;
  x: number;
  y: number;
} {
  const rect = element.getBoundingClientRect();

  return {
    x: rect.left - rootRect.left,
    y: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height,
  };
}

function isVisibleElement(element: Element): boolean {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    style.opacity !== "0" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function createExportBounds(
  rect: Pick<DOMRect, "bottom" | "height" | "left" | "right" | "top" | "width">,
): ProjectPreviewExportBounds {
  const left = Math.floor(rect.left);
  const top = Math.floor(rect.top);
  const right = Math.ceil(rect.right);
  const bottom = Math.ceil(rect.bottom);

  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function getVisibleElementBounds(
  elements: Element[],
  fallbackRect: DOMRect,
): ProjectPreviewExportBounds {
  const visibleRects = elements
    .filter(isVisibleElement)
    .map((element) => element.getBoundingClientRect());

  if (visibleRects.length === 0) {
    return createExportBounds(fallbackRect);
  }

  const left = Math.floor(Math.min(...visibleRects.map((rect) => rect.left)));
  const top = Math.floor(Math.min(...visibleRects.map((rect) => rect.top)));
  const right = Math.ceil(Math.max(...visibleRects.map((rect) => rect.right)));
  const bottom = Math.ceil(
    Math.max(...visibleRects.map((rect) => rect.bottom)),
  );

  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

function getProjectPreviewExportBounds(
  chartRoot: HTMLElement,
  svg: SVGSVGElement,
): ProjectPreviewExportBounds {
  return getVisibleElementBounds(
    [
      svg,
      ...Array.from(
        chartRoot.querySelectorAll(
          ".grid-header, .upper-text, .lower-text, .current-date-highlight, .current-highlight, .current-ball-highlight",
        ),
      ),
    ],
    chartRoot.getBoundingClientRect(),
  );
}

function getElementBackgroundColor(element: Element): string {
  const backgroundColor = window
    .getComputedStyle(element)
    .getPropertyValue("background-color")
    .trim();

  if (!backgroundColor || backgroundColor === "rgba(0, 0, 0, 0)") {
    return defaultGanttPalette.neutral.background;
  }

  return backgroundColor;
}

function createSvgDataUrl(markup: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
}

function parseRgbChannel(value: string): number {
  return Math.max(0, Math.min(255, Math.round(Number.parseFloat(value.trim()))));
}

function parseExportBackgroundColor(
  color: string,
): ProjectPreviewExportRgbColor | null {
  const normalized = color.trim();

  if (!normalized) {
    return null;
  }

  if (normalized.startsWith("#")) {
    const hex = normalized.slice(1);
    const expanded =
      hex.length === 3
        ? hex
            .split("")
            .map((channel) => `${channel}${channel}`)
            .join("")
        : hex;

    if (expanded.length !== 6) {
      return null;
    }

    return {
      red: Number.parseInt(expanded.slice(0, 2), 16),
      green: Number.parseInt(expanded.slice(2, 4), 16),
      blue: Number.parseInt(expanded.slice(4, 6), 16),
    };
  }

  const match = normalized.match(/rgba?\(([^)]+)\)/i);

  if (!match) {
    return null;
  }

  const channels = match[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => parseRgbChannel(channel));

  if (channels.length !== 3 || channels.some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return {
    red: channels[0] ?? 0,
    green: channels[1] ?? 0,
    blue: channels[2] ?? 0,
  };
}

function isBackgroundPixel(
  data: Uint8ClampedArray,
  index: number,
  backgroundColor: ProjectPreviewExportRgbColor,
  tolerance: number,
): boolean {
  const alpha = data[index + 3] ?? 0;

  if (alpha === 0) {
    return true;
  }

  const red = data[index] ?? 0;
  const green = data[index + 1] ?? 0;
  const blue = data[index + 2] ?? 0;

  return (
    Math.abs(red - backgroundColor.red) <= tolerance &&
    Math.abs(green - backgroundColor.green) <= tolerance &&
    Math.abs(blue - backgroundColor.blue) <= tolerance
  );
}

export function getAspectRatio(size: ProjectPreviewExportSize): number {
  if (size.width <= 0 || size.height <= 0) {
    return 0;
  }

  return size.width / size.height;
}

export function getAspectRatioDelta(
  source: ProjectPreviewExportSize,
  target: ProjectPreviewExportSize,
): number {
  return Math.abs(getAspectRatio(source) - getAspectRatio(target));
}

export function measureTrailingContentBoundsFromImageData(
  imageData: Uint8ClampedArray,
  width: number,
  height: number,
  backgroundColor: string,
  tolerance = 8,
): ProjectPreviewExportSize {
  const parsedBackground = parseExportBackgroundColor(backgroundColor);

  if (!parsedBackground || width <= 0 || height <= 0) {
    return { width, height };
  }

  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;

      if (
        !isBackgroundPixel(imageData, index, parsedBackground, tolerance)
      ) {
        if (x > maxX) {
          maxX = x;
        }

        if (y > maxY) {
          maxY = y;
        }
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    return { width, height };
  }

  return {
    width: maxX + 1,
    height: maxY + 1,
  };
}

function collectTextOverlays(
  source: HTMLElement,
  rootRect: Pick<ProjectPreviewExportBounds, "left" | "top">,
): ProjectPreviewExportTextOverlay[] {
  return Array.from(
    source.querySelectorAll<HTMLElement>(".upper-text, .lower-text"),
  )
    .filter(
      (element) =>
        isVisibleElement(element) && Boolean(element.textContent?.trim()),
    )
    .map((element) => {
      const rect = getExportRect(element, rootRect);
      const style = window.getComputedStyle(element);

      return {
        type: "text" as const,
        text: element.textContent?.trim() ?? "",
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        maxWidth: rect.width > 0 ? rect.width : undefined,
        color: style.getPropertyValue("color").trim(),
        font: `${style.getPropertyValue("font-weight").trim()} ${style
          .getPropertyValue("font-size")
          .trim()} ${style.getPropertyValue("font-family").trim()}`,
      };
    });
}

function collectHighlightOverlays(
  source: HTMLElement,
  rootRect: Pick<ProjectPreviewExportBounds, "left" | "top">,
): ProjectPreviewExportOverlay[] {
  const overlays: ProjectPreviewExportOverlay[] = [];

  source
    .querySelectorAll<HTMLElement>(".current-date-highlight")
    .forEach((element) => {
      if (!isVisibleElement(element)) {
        return;
      }

      const rect = getExportRect(element, rootRect);

      overlays.push({
        type: "rect",
        fill: getElementBackgroundColor(element),
        radius: 5,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      });
    });

  source
    .querySelectorAll<HTMLElement>(".current-highlight")
    .forEach((element) => {
      if (!isVisibleElement(element)) {
        return;
      }

      const rect = getExportRect(element, rootRect);

      overlays.push({
        type: "rect",
        fill: getElementBackgroundColor(element),
        x: rect.x,
        y: rect.y,
        width: Math.max(1, rect.width),
        height: rect.height,
      });
    });

  source
    .querySelectorAll<HTMLElement>(".current-ball-highlight")
    .forEach((element) => {
      if (!isVisibleElement(element)) {
        return;
      }

      const rect = getExportRect(element, rootRect);

      overlays.push({
        type: "circle",
        fill: getElementBackgroundColor(element),
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
        radius: Math.max(rect.width, rect.height) / 2,
      });
    });

  return overlays;
}

export function buildProjectPreviewExportModel(
  source: HTMLElement,
): ProjectPreviewExportModel {
  const chartRoot = source.querySelector<HTMLElement>(".gantt-container") ?? source;
  const svg =
    chartRoot.querySelector<SVGSVGElement>("svg.gantt") ??
    source.querySelector<SVGSVGElement>("svg.gantt");

  if (!svg) {
    throw new Error("project preview svg not found");
  }

  const exportBounds = getProjectPreviewExportBounds(chartRoot, svg);
  const width = exportBounds.width;
  const height = exportBounds.height;

  if (width <= 0 || height <= 0) {
    throw new Error("invalid project export size");
  }

  const svgRect = svg.getBoundingClientRect();
  const cloneShell = document.createElement("div");
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

  cloneShell.appendChild(clonedSvg);
  inlineSvgPresentationStyles(chartRoot, cloneShell);
  stabilizeSvgAnimations(cloneShell);

  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", `${Math.ceil(svgRect.width)}`);
  clonedSvg.setAttribute("height", `${Math.ceil(svgRect.height)}`);
  clonedSvg.style.background = "transparent";

  const serializer = new XMLSerializer();
  const svgMarkup = serializer.serializeToString(clonedSvg);
  const overlays = [
    ...collectHighlightOverlays(chartRoot, exportBounds),
    ...collectTextOverlays(chartRoot, exportBounds),
  ];

  return {
    width,
    height,
    background: getElementBackgroundColor(chartRoot),
    svgDataUrl: createSvgDataUrl(svgMarkup),
    svgX: svgRect.left - exportBounds.left,
    svgY: svgRect.top - exportBounds.top,
    svgWidth: svgRect.width,
    svgHeight: svgRect.height,
    overlays,
  };
}

function drawRoundedRect(
  context: ProjectPreviewExportCanvasRenderingContextLike,
  overlay: ProjectPreviewExportRectOverlay,
) {
  context.beginPath();
  context.roundRect(
    overlay.x,
    overlay.y,
    overlay.width,
    overlay.height,
    overlay.radius ?? 0,
  );
  context.fill();
}

function drawOverlay(
  context: ProjectPreviewExportCanvasRenderingContextLike,
  overlay: ProjectPreviewExportOverlay,
) {
  context.save();

  if (overlay.type === "text") {
    context.fillStyle = overlay.color;
    context.font = overlay.font;
    context.fillText(overlay.text, overlay.x, overlay.y, overlay.maxWidth);
    context.restore();
    return;
  }

  if (overlay.type === "circle") {
    context.fillStyle = overlay.fill;
    context.beginPath();
    context.arc(overlay.x, overlay.y, overlay.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();
    return;
  }

  context.fillStyle = overlay.fill;

  if (overlay.radius) {
    drawRoundedRect(context, overlay);
  } else {
    context.fillRect(overlay.x, overlay.y, overlay.width, overlay.height);
  }

  context.restore();
}

function loadSvgDataUrlImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("project export svg image load failed"));
    image.src = dataUrl;
  });
}

export async function renderProjectPreviewExportModel(
  model: ProjectPreviewExportModel,
  options?: {
    createCanvas?: () => ProjectPreviewExportCanvasLike;
    loadSvgImage?: (dataUrl: string) => Promise<CanvasImageSource>;
    pixelRatio?: number;
  },
): Promise<string> {
  const pixelRatio = options?.pixelRatio ?? 2;
  const canvas =
    options?.createCanvas?.() ??
    (document.createElement("canvas") as ProjectPreviewExportCanvasLike);
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("project export canvas context unavailable");
  }

  canvas.width = Math.ceil(model.width * pixelRatio);
  canvas.height = Math.ceil(model.height * pixelRatio);
  if (canvas.style) {
    canvas.style.width = `${model.width}px`;
    canvas.style.height = `${model.height}px`;
  }

  context.scale(pixelRatio, pixelRatio);
  context.fillStyle = model.background;
  context.fillRect(0, 0, model.width, model.height);

  const svgImage =
    (await options?.loadSvgImage?.(model.svgDataUrl)) ??
    (await loadSvgDataUrlImage(model.svgDataUrl));

  context.drawImage(
    svgImage,
    model.svgX,
    model.svgY,
    model.svgWidth,
    model.svgHeight,
  );

  model.overlays.forEach((overlay) => drawOverlay(context, overlay));

  if (typeof context.getImageData === "function") {
    const renderedBounds = measureTrailingContentBoundsFromImageData(
      context.getImageData(0, 0, canvas.width, canvas.height).data,
      canvas.width,
      canvas.height,
      model.background,
    );

    if (
      renderedBounds.width > 0 &&
      renderedBounds.height > 0 &&
      (renderedBounds.width < canvas.width ||
        renderedBounds.height < canvas.height)
    ) {
      const trimmedCanvas =
        options?.createCanvas?.() ??
        (document.createElement("canvas") as ProjectPreviewExportCanvasLike);
      const trimmedContext = trimmedCanvas.getContext("2d");

      if (trimmedContext) {
        trimmedCanvas.width = renderedBounds.width;
        trimmedCanvas.height = renderedBounds.height;
        if (trimmedCanvas.style) {
          trimmedCanvas.style.width = `${renderedBounds.width / pixelRatio}px`;
          trimmedCanvas.style.height = `${renderedBounds.height / pixelRatio}px`;
        }

        trimmedContext.drawImage(
          canvas as unknown as CanvasImageSource,
          0,
          0,
          renderedBounds.width,
          renderedBounds.height,
          0,
          0,
          renderedBounds.width,
          renderedBounds.height,
        );

        return trimmedCanvas.toDataURL("image/png");
      }
    }
  }

  return canvas.toDataURL("image/png");
}

export async function exportProjectPreviewImage(
  source: HTMLElement,
  options?: {
    createCanvas?: () => ProjectPreviewExportCanvasLike;
    loadSvgImage?: (dataUrl: string) => Promise<CanvasImageSource>;
    pixelRatio?: number;
  },
): Promise<string> {
  const model = buildProjectPreviewExportModel(source);

  return renderProjectPreviewExportModel(model, options);
}
