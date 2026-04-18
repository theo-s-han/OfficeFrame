import {
  renderProjectPreviewExportModel,
  type ProjectPreviewExportModel,
} from "./projectPreviewExport";
import {
  inlineSvgPresentationStyles,
  stabilizeSvgAnimations,
} from "./svgExport";
import { defaultGanttPalette } from "./theme";

type WbsTreePreviewExportOptions = Parameters<
  typeof renderProjectPreviewExportModel
>[1];

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
  return source.querySelector<HTMLElement>(".typed-gantt-wbs .wbs-tree-surface");
}

function getWbsPreviewSvg(source: HTMLElement): SVGSVGElement | null {
  return (
    getWbsPreviewSurface(source)?.querySelector<SVGSVGElement>("svg") ??
    source.querySelector<SVGSVGElement>(".wbs-tree-surface svg")
  );
}

async function waitForWbsPreviewSvg(
  source: HTMLElement,
  timeoutMs = 1500,
): Promise<SVGSVGElement> {
  const startedAt = window.performance.now();
  const existingSvg = getWbsPreviewSvg(source);

  if (existingSvg) {
    return existingSvg;
  }

  while (window.performance.now() - startedAt < timeoutMs) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const svg = getWbsPreviewSvg(source);

    if (svg) {
      return svg;
    }
  }

  throw new Error("wbs tree preview svg not found");
}

export function buildWbsTreePreviewExportModel(
  source: HTMLElement,
): ProjectPreviewExportModel {
  const surface = getWbsPreviewSurface(source);
  const svg = getWbsPreviewSvg(source);

  if (!surface || !svg) {
    throw new Error("wbs tree preview svg not found");
  }

  const surfaceRect = surface.getBoundingClientRect();
  const svgRect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(surfaceRect.width));
  const height = Math.max(1, Math.ceil(surfaceRect.height));

  if (width <= 0 || height <= 0 || svgRect.width <= 0 || svgRect.height <= 0) {
    throw new Error("invalid wbs tree export size");
  }

  const cloneShell = document.createElement("div");
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

  cloneShell.appendChild(clonedSvg);
  inlineSvgPresentationStyles(source, cloneShell);
  stabilizeSvgAnimations(cloneShell);

  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", `${svgRect.width}`);
  clonedSvg.setAttribute("height", `${svgRect.height}`);
  clonedSvg.style.background = "transparent";

  const svgMarkup = new XMLSerializer().serializeToString(clonedSvg);

  return {
    width,
    height,
    background: getElementBackgroundColor(surface),
    svgDataUrl: createSvgDataUrl(svgMarkup),
    svgX: Math.max(0, svgRect.left - surfaceRect.left),
    svgY: Math.max(0, svgRect.top - surfaceRect.top),
    svgWidth: svgRect.width,
    svgHeight: svgRect.height,
    overlays: [],
  };
}

export async function exportWbsTreePreviewImage(
  source: HTMLElement,
  options?: WbsTreePreviewExportOptions,
): Promise<string> {
  await waitForWbsPreviewSvg(source);
  const model = buildWbsTreePreviewExportModel(source);

  return renderProjectPreviewExportModel(model, options);
}

