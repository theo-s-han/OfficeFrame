import { toPng } from "html-to-image";

export type PreviewExportSize = {
  height: number;
  width: number;
};

type ToPngLike = typeof toPng;

export function getPreviewExportSize(element: HTMLElement): PreviewExportSize {
  const rect = element.getBoundingClientRect();

  return {
    width: Math.max(
      1,
      Math.ceil(
        Math.max(
          rect.width,
          element.scrollWidth,
          element.offsetWidth,
          element.clientWidth,
          1,
        ),
      ),
    ),
    height: Math.max(
      1,
      Math.ceil(
        Math.max(
          rect.height,
          element.scrollHeight,
          element.offsetHeight,
          element.clientHeight,
          1,
        ),
      ),
    ),
  };
}

export async function waitForPreviewExportReady(
  source: HTMLElement,
  options?: {
    getSize?: (target: HTMLElement) => PreviewExportSize;
    getTarget?: (source: HTMLElement) => HTMLElement;
    timeoutMs?: number;
  },
): Promise<HTMLElement> {
  const getTarget = options?.getTarget ?? ((node: HTMLElement) => node);
  const getSize = options?.getSize ?? getPreviewExportSize;
  const timeoutMs = options?.timeoutMs ?? 1600;
  const startedAt = window.performance.now();

  while (window.performance.now() - startedAt < timeoutMs) {
    const target = getTarget(source);
    const size = getSize(target);

    if (size.width > 1 && size.height > 1) {
      return target;
    }

    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
  }

  throw new Error("preview export target not ready");
}

export async function exportPreviewSurfaceImage(
  source: HTMLElement,
  options?: {
    backgroundColor?: string;
    getRenderSize?: (target: HTMLElement) => PreviewExportSize;
    getSize?: (target: HTMLElement) => PreviewExportSize;
    getTarget?: (source: HTMLElement) => HTMLElement;
    pixelRatio?: number;
    prepareTarget?: (
      target: HTMLElement,
      source: HTMLElement,
    ) =>
      | void
      | (() => void | Promise<void>)
      | Promise<void | (() => void | Promise<void>)>;
    skipFonts?: boolean;
    toPngImpl?: ToPngLike;
  },
) {
  const backgroundColor = options?.backgroundColor ?? "#FFFFFF";
  const target = await waitForPreviewExportReady(source, {
    getSize: options?.getSize,
    getTarget: options?.getTarget,
  });
  const cleanup = await options?.prepareTarget?.(target, source);
  const size = (options?.getSize ?? getPreviewExportSize)(target);
  const renderSize = (options?.getRenderSize ?? options?.getSize ?? getPreviewExportSize)(
    target,
  );
  const toPngImpl = options?.toPngImpl ?? toPng;

  try {
    return await toPngImpl(target, {
      cacheBust: true,
      backgroundColor,
      canvasWidth: size.width,
      canvasHeight: size.height,
      pixelRatio: options?.pixelRatio ?? 2,
      skipFonts: options?.skipFonts,
      width: renderSize.width,
      height: renderSize.height,
      style: {
        margin: "0",
        backgroundColor,
        width: `${renderSize.width}px`,
        height: `${renderSize.height}px`,
      },
    });
  } finally {
    if (cleanup) {
      await cleanup();
    }
  }
}
