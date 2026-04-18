import {
  renderProjectPreviewExportModel,
  type ProjectPreviewExportModel,
} from "./projectPreviewExport";
import {
  inlineSvgPresentationStyles,
  stabilizeSvgAnimations,
} from "./svgExport";
import { defaultGanttPalette } from "./theme";

type MilestonePreviewExportOptions = Parameters<
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

function getMilestonePreviewSvg(source: HTMLElement): SVGSVGElement | null {
  return (
    source.querySelector<SVGSVGElement>(
      ".typed-gantt-milestones .mermaid-preview svg",
    ) ?? source.querySelector<SVGSVGElement>(".mermaid-kind-timeline svg")
  );
}

async function waitForMilestonePreviewSvg(
  source: HTMLElement,
  timeoutMs = 1200,
): Promise<SVGSVGElement> {
  const startedAt = window.performance.now();
  const existingSvg = getMilestonePreviewSvg(source);

  if (existingSvg) {
    return existingSvg;
  }

  while (window.performance.now() - startedAt < timeoutMs) {
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });

    const svg = getMilestonePreviewSvg(source);

    if (svg) {
      return svg;
    }
  }

  throw new Error("milestone preview svg not found");
}

export function buildMilestonePreviewExportModel(
  source: HTMLElement,
): ProjectPreviewExportModel {
  const svg = getMilestonePreviewSvg(source);

  if (!svg) {
    throw new Error("milestone preview svg not found");
  }

  const svgRect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(svgRect.width));
  const height = Math.max(1, Math.ceil(svgRect.height));

  if (width <= 0 || height <= 0) {
    throw new Error("invalid milestone export size");
  }

  const cloneShell = document.createElement("div");
  const clonedSvg = svg.cloneNode(true) as SVGSVGElement;

  cloneShell.appendChild(clonedSvg);
  inlineSvgPresentationStyles(source, cloneShell);
  stabilizeSvgAnimations(cloneShell);

  clonedSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSvg.setAttribute("width", `${width}`);
  clonedSvg.setAttribute("height", `${height}`);
  clonedSvg.style.background = "transparent";

  const svgMarkup = new XMLSerializer().serializeToString(clonedSvg);
  const previewSurface =
    svg.closest<HTMLElement>(".mermaid-preview") ??
    svg.closest<HTMLElement>(".adapter-preview-section");

  return {
    width,
    height,
    background: getElementBackgroundColor(previewSurface),
    svgDataUrl: createSvgDataUrl(svgMarkup),
    svgX: 0,
    svgY: 0,
    svgWidth: svgRect.width,
    svgHeight: svgRect.height,
    overlays: [],
  };
}

export async function exportMilestonePreviewImage(
  source: HTMLElement,
  options?: MilestonePreviewExportOptions,
): Promise<string> {
  await waitForMilestonePreviewSvg(source);
  const model = buildMilestonePreviewExportModel(source);

  return renderProjectPreviewExportModel(model, options);
}
