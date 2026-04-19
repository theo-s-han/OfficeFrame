import { defaultGanttPalette } from "@/lib/gantt/theme";

export type MindmapPreviewExportHandle = {
  exportPng: (noForeignObject?: boolean, injectCss?: string) => Promise<Blob | null>;
};

type MindmapExportOptions = {
  blobToDataUrlImpl?: (blob: Blob) => Promise<string>;
  injectCss?: string;
  noForeignObject?: boolean;
};

const defaultMindmapExportCss = `
  svg {
    background: ${defaultGanttPalette.neutral.background};
  }
`;

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("mindmap export did not return a data url"));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error("mindmap export file reader failed"));
    };
    reader.readAsDataURL(blob);
  });
}

export async function exportMindmapPreviewImage(
  source: MindmapPreviewExportHandle,
  options?: MindmapExportOptions,
): Promise<string> {
  const blob = await source.exportPng(
    options?.noForeignObject ?? false,
    options?.injectCss ?? defaultMindmapExportCss,
  );

  if (!blob) {
    throw new Error("mindmap export returned an empty image");
  }

  const blobToDataUrlImpl = options?.blobToDataUrlImpl ?? blobToDataUrl;

  return blobToDataUrlImpl(blob);
}
