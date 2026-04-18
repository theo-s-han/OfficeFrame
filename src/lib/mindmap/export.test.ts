import { describe, expect, it, vi } from "vitest";
import {
  exportMindmapPreviewImage,
  getMindmapExportElement,
  getMindmapExportSize,
} from "./export";

function createSizedElement(width: number, height: number, className?: string) {
  const element = document.createElement("div");

  if (className) {
    element.className = className;
  }

  Object.defineProperty(element, "getBoundingClientRect", {
    value: () => ({
      width,
      height,
      left: 0,
      top: 0,
      right: width,
      bottom: height,
    }),
  });

  return element;
}

describe("mindmap export", () => {
  it("targets the rendered map canvas when available", () => {
    const source = document.createElement("div");
    const canvas = createSizedElement(720, 480, "map-canvas");

    source.appendChild(canvas);

    expect(getMindmapExportElement(source)).toBe(canvas);
  });

  it("reads export dimensions from the visible chart bounds", () => {
    const element = createSizedElement(640.2, 382.4);

    expect(getMindmapExportSize(element)).toEqual({
      width: 641,
      height: 383,
    });
  });

  it("passes preview bounds to the image renderer", async () => {
    const source = document.createElement("div");
    const canvas = createSizedElement(680, 420, "map-canvas");
    const toPngImpl = vi.fn().mockResolvedValue("data:image/png;base64,test");

    source.appendChild(canvas);

    await expect(
      exportMindmapPreviewImage(source, { pixelRatio: 3, toPngImpl }),
    ).resolves.toBe("data:image/png;base64,test");

    expect(toPngImpl).toHaveBeenCalledWith(
      canvas,
      expect.objectContaining({
        width: 680,
        height: 420,
        pixelRatio: 3,
      }),
    );
  });
});
