import {
  exportPreviewSurfaceImage,
  getPreviewExportSize,
  waitForPreviewExportReady,
} from "./previewExport";

describe("previewExport", () => {
  it("reads size from bounding rect", () => {
    const element = document.createElement("div");

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      width: 412.2,
      height: 218.6,
      top: 0,
      left: 0,
      right: 412.2,
      bottom: 218.6,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    expect(getPreviewExportSize(element)).toEqual({
      width: 413,
      height: 219,
    });
  });

  it("prefers larger scroll dimensions when the export surface overflows", () => {
    const element = document.createElement("div");

    Object.defineProperty(element, "scrollWidth", {
      configurable: true,
      value: 860,
    });
    Object.defineProperty(element, "scrollHeight", {
      configurable: true,
      value: 420,
    });

    vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
      width: 320,
      height: 180,
      top: 0,
      left: 0,
      right: 320,
      bottom: 180,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    expect(getPreviewExportSize(element)).toEqual({
      width: 860,
      height: 420,
    });
  });

  it("waits until target has visible size", async () => {
    const source = document.createElement("div");
    const target = document.createElement("div");
    let callCount = 0;

    vi.spyOn(target, "getBoundingClientRect").mockImplementation(() => {
      callCount += 1;

      if (callCount < 2) {
        return {
          width: 0,
          height: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        };
      }

      return {
        width: 320,
        height: 180,
        top: 0,
        left: 0,
        right: 320,
        bottom: 180,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      };
    });

    await expect(
      waitForPreviewExportReady(source, {
        getTarget: () => target,
        timeoutMs: 120,
      }),
    ).resolves.toBe(target);
  });

  it("uses a custom size resolver during export", async () => {
    const source = document.createElement("div");
    const toPngImpl = vi.fn().mockResolvedValue("data:image/png;base64,preview");

    await expect(
      exportPreviewSurfaceImage(source, {
        getSize: () => ({
          width: 702,
          height: 388,
        }),
        pixelRatio: 1,
        toPngImpl,
      }),
    ).resolves.toBe("data:image/png;base64,preview");

    expect(toPngImpl).toHaveBeenCalledWith(
      source,
      expect.objectContaining({
        canvasWidth: 702,
        canvasHeight: 388,
        width: 702,
        height: 388,
        pixelRatio: 1,
        style: expect.objectContaining({
          width: "702px",
          height: "388px",
        }),
      }),
    );
  });

  it("allows render size to differ from final canvas size and cleans up after export", async () => {
    const source = document.createElement("div");
    const target = document.createElement("div");
    const cleanup = vi.fn();
    const toPngImpl = vi.fn().mockResolvedValue("data:image/png;base64,preview");

    await expect(
      exportPreviewSurfaceImage(source, {
        getTarget: () => target,
        getSize: () => ({
          width: 720,
          height: 360,
        }),
        getRenderSize: () => ({
          width: 900,
          height: 450,
        }),
        prepareTarget: async () => cleanup,
        skipFonts: true,
        toPngImpl,
      }),
    ).resolves.toBe("data:image/png;base64,preview");

    expect(toPngImpl).toHaveBeenCalledWith(
      target,
      expect.objectContaining({
        skipFonts: true,
        canvasWidth: 720,
        canvasHeight: 360,
        width: 900,
        height: 450,
        style: expect.objectContaining({
          width: "900px",
          height: "450px",
        }),
      }),
    );
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
