import { defaultGanttPalette } from "@/lib/gantt/theme";
import { exportPreviewSurfaceImage } from "@/lib/shared/previewExport";

export function getOrgChartExportElement(source: HTMLElement) {
  return (
    source.querySelector<HTMLElement>(".orgchart-preview-stage") ??
    source.querySelector<HTMLElement>(".orgchart-preview-surface") ??
    source
  );
}

export async function exportOrgChartPreviewImage(source: HTMLElement) {
  return exportPreviewSurfaceImage(source, {
    backgroundColor: defaultGanttPalette.neutral.background,
    getTarget: getOrgChartExportElement,
  });
}
