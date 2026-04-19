export type PoseStageExportHandle = {
  toDataURL: (options?: { pixelRatio?: number }) => string;
};

export function exportPoseStagePng(
  stage: PoseStageExportHandle,
  pixelRatio: number,
) {
  return stage.toDataURL({
    pixelRatio,
  });
}

export function exportPoseCanvasPng(canvas: HTMLCanvasElement) {
  return canvas.toDataURL("image/png");
}

export function getPoseExportFileName() {
  return "character-pose.png";
}
