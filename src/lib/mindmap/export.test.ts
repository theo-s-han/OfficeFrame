import { describe, expect, it, vi } from "vitest";
import { blobToDataUrl, exportMindmapPreviewImage } from "./export";

describe("mindmap export", () => {
  it("exports from the preview instance instead of DOM bounds", async () => {
    const blob = new Blob(["mindmap"], { type: "image/png" });
    const exportPng = vi.fn().mockResolvedValue(blob);
    const blobToDataUrlImpl = vi.fn().mockResolvedValue("data:image/png;base64,test");

    await expect(
      exportMindmapPreviewImage(
        {
          exportPng,
        },
        { blobToDataUrlImpl },
      ),
    ).resolves.toBe("data:image/png;base64,test");

    expect(exportPng).toHaveBeenCalledWith(
      false,
      expect.stringContaining("background: #FFFFFF"),
    );
    expect(blobToDataUrlImpl).toHaveBeenCalledWith(blob);
  });

  it("throws when the preview exporter returns an empty blob", async () => {
    await expect(
      exportMindmapPreviewImage({
        exportPng: vi.fn().mockResolvedValue(null),
      }),
    ).rejects.toThrow("mindmap export returned an empty image");
  });

  it("converts the exported blob to a data url", async () => {
    const dataUrl = await blobToDataUrl(new Blob(["mindmap"], { type: "image/png" }));

    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
