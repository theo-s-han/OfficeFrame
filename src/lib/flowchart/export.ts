import { defaultGanttPalette } from "@/lib/gantt/theme";
import { exportPreviewSurfaceImage } from "@/lib/shared/previewExport";

export function getFlowchartExportElement(source: HTMLElement) {
  return (
    source.querySelector<HTMLElement>(".flowchart-preview-surface") ?? source
  );
}

export async function exportFlowchartPreviewImage(source: HTMLElement) {
  return exportPreviewSurfaceImage(source, {
    backgroundColor: defaultGanttPalette.neutral.background,
    getTarget: getFlowchartExportElement,
  });
}
