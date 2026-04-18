import { toPng } from "html-to-image";
import { defaultGanttPalette } from "@/lib/gantt/theme";

type MindmapExportSize = {
  height: number;
  width: number;
};

type MindmapToPng = typeof toPng;

export function getMindmapExportElement(source: HTMLElement): HTMLElement {
  return (
    source.querySelector<HTMLElement>(".map-canvas") ??
    source.querySelector<HTMLElement>(".map-container") ??
    source
  );
}

export function getMindmapExportSize(
  element: HTMLElement,
): MindmapExportSize {
  const rect = element.getBoundingClientRect();

  return {
    width: Math.max(1, Math.ceil(rect.width || element.scrollWidth || 1)),
    height: Math.max(1, Math.ceil(rect.height || element.scrollHeight || 1)),
  };
}

export async function waitForMindmapPreviewReady(
  source: HTMLElement,
  timeoutMs = 1200,
): Promise<HTMLElement> {
  const startedAt = window.performance.now();

  while (window.performance.now() - startedAt < timeoutMs) {
    const target = getMindmapExportElement(source);
    const size = getMindmapExportSize(target);

    if (size.width > 1 && size.height > 1) {
      return target;
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  throw new Error("mindmap preview not ready");
}

export async function exportMindmapPreviewImage(
  source: HTMLElement,
  options?: {
    pixelRatio?: number;
    toPngImpl?: MindmapToPng;
  },
): Promise<string> {
  const target = await waitForMindmapPreviewReady(source);
  const size = getMindmapExportSize(target);
  const toPngImpl = options?.toPngImpl ?? toPng;

  return toPngImpl(target, {
    cacheBust: true,
    backgroundColor: defaultGanttPalette.neutral.background,
    pixelRatio: options?.pixelRatio ?? 2,
    width: size.width,
    height: size.height,
    style: {
      margin: "0",
      backgroundColor: defaultGanttPalette.neutral.background,
    },
  });
}
