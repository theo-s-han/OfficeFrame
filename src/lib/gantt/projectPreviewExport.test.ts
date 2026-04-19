import { describe, expect, it, vi } from "vitest";
import {
  buildProjectPreviewExportModel,
  getAspectRatioDelta,
  measureTrailingContentBoundsFromImageData,
  renderProjectPreviewExportModel,
} from "./projectPreviewExport";

function mockRect(
  element: Element | null,
  rect: {
    height: number;
    left: number;
    top: number;
    width: number;
  },
) {
  if (!element) {
    throw new Error("missing element for rect mock");
  }

  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      bottom: rect.top + rect.height,
      height: rect.height,
      left: rect.left,
      right: rect.left + rect.width,
      top: rect.top,
      width: rect.width,
      x: rect.left,
      y: rect.top,
      toJSON: () => rect,
    }),
  });
}

describe("project preview export", () => {
  it("crops the export size to the visible chart content", () => {
    document.body.innerHTML = `
      <div id="source" style="background-color: rgb(255, 255, 255);">
        <div class="gantt-preview">
          <div class="gantt-preview-canvas view-week">
            <div class="gantt-container">
              <svg class="gantt" width="800" height="285" xmlns="http://www.w3.org/2000/svg">
                <rect class="grid-background" x="0" y="0" width="800" height="285" style="fill: rgb(0, 0, 0);" />
                <rect class="bar" x="20" y="94" width="217" height="30" rx="3" ry="3" style="fill: rgb(234, 241, 236); stroke: rgb(78, 139, 99); stroke-width: 0.8;" />
                <rect class="bar-progress" x="20" y="94" width="173" height="30" rx="5" ry="5" style="fill: rgb(67, 120, 85);" />
                <text class="bar-label" x="90" y="109" style="fill: rgb(31, 41, 55); font-size: 13px; font-weight: 700;">Task A</text>
                <animate attributeName="width" from="0" to="217" />
              </svg>
              <div class="grid-header">
                <div class="upper-text" style="color: rgb(31, 41, 55); font-size: 14px; font-weight: 700; font-family: Arial;">2026-04</div>
                <div class="lower-text current-date-highlight" style="color: rgb(255, 255, 255); background-color: rgb(197, 155, 58); font-size: 12px; font-weight: 600; font-family: Arial;">W2</div>
              </div>
              <div class="current-highlight" style="background-color: rgb(197, 155, 58);"></div>
              <div class="current-ball-highlight" style="background-color: rgb(197, 155, 58);"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const source = document.getElementById("source");

    if (!source) {
      throw new Error("missing export source");
    }

    mockRect(source, { left: 0, top: 0, width: 1280, height: 470 });
    mockRect(source.querySelector(".gantt-preview"), {
      left: 0,
      top: 0,
      width: 1280,
      height: 470,
    });
    mockRect(source.querySelector(".gantt-preview-canvas"), {
      left: 0,
      top: 0,
      width: 1280,
      height: 470,
    });
    mockRect(source.querySelector(".gantt-container"), {
      left: 0,
      top: 0,
      width: 1280,
      height: 470,
    });
    mockRect(source.querySelector(".grid-header"), {
      left: 0,
      top: 0,
      width: 800,
      height: 75,
    });
    mockRect(source.querySelector("svg.gantt"), {
      left: 0,
      top: 75,
      width: 800,
      height: 285,
    });
    mockRect(source.querySelector(".upper-text"), {
      left: 0,
      top: 10,
      width: 70,
      height: 20,
    });
    mockRect(source.querySelector(".lower-text"), {
      left: 10,
      top: 48,
      width: 28,
      height: 24,
    });
    mockRect(source.querySelector(".current-highlight"), {
      left: 32,
      top: 85,
      width: 1,
      height: 200,
    });
    mockRect(source.querySelector(".current-ball-highlight"), {
      left: 29,
      top: 79,
      width: 6,
      height: 6,
    });

    const model = buildProjectPreviewExportModel(source);

    expect(model.width).toBe(800);
    expect(model.height).toBe(360);
    expect(model.svgX).toBe(0);
    expect(model.svgY).toBe(75);
    expect(model.svgDataUrl).toContain("data:image/svg+xml");
    expect(decodeURIComponent(model.svgDataUrl)).toContain('class="bar"');
    expect(decodeURIComponent(model.svgDataUrl)).not.toContain("<animate");
    expect(decodeURIComponent(model.svgDataUrl)).toContain('fill="none"');
    expect(model.overlays).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "text", text: "2026-04" }),
        expect.objectContaining({ type: "text", text: "W2" }),
        expect.objectContaining({ type: "rect", width: 1 }),
        expect.objectContaining({ type: "circle", radius: 3 }),
      ]),
    );
  });

  it("trims trailing blank export space and keeps the preview/output ratio within tolerance", () => {
    const previewChartSize = {
      width: 160,
      height: 72,
    };
    const renderedCanvasSize = {
      width: 220,
      height: 120,
    };
    const pixelData = new Uint8ClampedArray(
      renderedCanvasSize.width * renderedCanvasSize.height * 4,
    );

    for (let y = 0; y < renderedCanvasSize.height; y += 1) {
      for (let x = 0; x < renderedCanvasSize.width; x += 1) {
        const index = (y * renderedCanvasSize.width + x) * 4;
        const isChartPixel =
          x < previewChartSize.width && y < previewChartSize.height;

        pixelData[index] = isChartPixel ? 91 : 255;
        pixelData[index + 1] = isChartPixel ? 110 : 255;
        pixelData[index + 2] = isChartPixel ? 225 : 255;
        pixelData[index + 3] = 255;
      }
    }

    const measuredBounds = measureTrailingContentBoundsFromImageData(
      pixelData,
      renderedCanvasSize.width,
      renderedCanvasSize.height,
      "#ffffff",
    );

    expect(measuredBounds).toEqual(previewChartSize);
    expect(
      getAspectRatioDelta(previewChartSize, measuredBounds),
    ).toBeLessThanOrEqual(0.01);
  });

  it("renders the collected model into a png data url with drawing operations", async () => {
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const fillText = vi.fn();
    const beginPath = vi.fn();
    const roundRect = vi.fn();
    const fill = vi.fn();
    const arc = vi.fn();
    const save = vi.fn();
    const restore = vi.fn();
    const scale = vi.fn();
    const fakeContext = {
      arc,
      beginPath,
      drawImage,
      fill,
      fillRect,
      fillStyle: "",
      fillText,
      font: "",
      restore,
      roundRect,
      save,
      scale,
      stroke: vi.fn(),
      strokeStyle: "",
    };
    const fakeCanvas = {
      getContext: vi.fn(() => fakeContext),
      height: 0,
      style: {},
      toDataURL: vi.fn(() => "data:image/png;base64,EXPORT_OK"),
      width: 0,
    };

    const dataUrl = await renderProjectPreviewExportModel(
      {
        background: "#ffffff",
        height: 320,
        overlays: [
          {
            type: "rect",
            fill: "#c59b3a",
            x: 10,
            y: 20,
            width: 20,
            height: 24,
            radius: 5,
          },
          {
            type: "text",
            color: "#1f2937",
            font: "700 14px Arial",
            text: "2026-04",
            x: 44,
            y: 26,
            maxWidth: 60,
          },
        ],
        svgDataUrl: "data:image/svg+xml;charset=utf-8,%3Csvg%20/%3E",
        svgHeight: 240,
        svgWidth: 800,
        svgX: 0,
        svgY: 75,
        width: 960,
      },
      {
        createCanvas: () => fakeCanvas,
        loadSvgImage: async () =>
          ({ width: 800, height: 240 }) as CanvasImageSource,
        pixelRatio: 1,
      },
    );

    expect(dataUrl).toBe("data:image/png;base64,EXPORT_OK");
    expect(fakeCanvas.width).toBe(960);
    expect(fakeCanvas.height).toBe(320);
    expect(scale).toHaveBeenCalledWith(1, 1);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 960, 320);
    expect(drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 75, 800, 240);
    expect(fillText).toHaveBeenCalledWith("2026-04", 44, 26, 60);
    expect(roundRect).toHaveBeenCalledWith(10, 20, 20, 24, 5);
    expect(arc).not.toHaveBeenCalled();
  });

  it("renders a trimmed png when the canvas has trailing blank space", async () => {
    const baseDrawImage = vi.fn();
    const trimmedDrawImage = vi.fn();
    const width = 220;
    const height = 120;
    const trimmedSize = {
      width: 160,
      height: 72,
    };
    const pixelData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const isChartPixel = x < trimmedSize.width && y < trimmedSize.height;

        pixelData[index] = isChartPixel ? 31 : 255;
        pixelData[index + 1] = isChartPixel ? 41 : 255;
        pixelData[index + 2] = isChartPixel ? 55 : 255;
        pixelData[index + 3] = 255;
      }
    }

    const baseContext = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      drawImage: baseDrawImage,
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      fillText: vi.fn(),
      font: "",
      getImageData: vi.fn(() => ({ data: pixelData })),
      restore: vi.fn(),
      roundRect: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: "",
    };
    const trimmedContext = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      drawImage: trimmedDrawImage,
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      fillText: vi.fn(),
      font: "",
      getImageData: undefined,
      restore: vi.fn(),
      roundRect: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: "",
    };
    const baseCanvas = {
      getContext: vi.fn(() => baseContext),
      height: 0,
      style: {},
      toDataURL: vi.fn(() => "data:image/png;base64,BASE"),
      width: 0,
    };
    const trimmedCanvas = {
      getContext: vi.fn(() => trimmedContext),
      height: 0,
      style: {},
      toDataURL: vi.fn(() => "data:image/png;base64,TRIMMED"),
      width: 0,
    };
    const createCanvas = vi
      .fn(() => baseCanvas as typeof baseCanvas | typeof trimmedCanvas)
      .mockReturnValueOnce(baseCanvas)
      .mockReturnValueOnce(trimmedCanvas);

    const dataUrl = await renderProjectPreviewExportModel(
      {
        background: "#ffffff",
        height,
        overlays: [],
        svgDataUrl: "data:image/svg+xml;charset=utf-8,%3Csvg%20/%3E",
        svgHeight: 72,
        svgWidth: 160,
        svgX: 0,
        svgY: 0,
        width,
      },
      {
        createCanvas,
        loadSvgImage: async () =>
          ({ width: 160, height: 72 }) as CanvasImageSource,
        pixelRatio: 1,
      },
    );

    expect(dataUrl).toBe("data:image/png;base64,TRIMMED");
    expect(trimmedCanvas.width).toBe(trimmedSize.width);
    expect(trimmedCanvas.height).toBe(trimmedSize.height);
    expect(trimmedDrawImage).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      0,
      trimmedSize.width,
      trimmedSize.height,
      0,
      0,
      trimmedSize.width,
      trimmedSize.height,
    );
    expect(
      getAspectRatioDelta(trimmedSize, {
        width: trimmedCanvas.width,
        height: trimmedCanvas.height,
      }),
    ).toBeLessThanOrEqual(0.01);
  });

  it("preserves configured trailing padding while trimming", async () => {
    const width = 220;
    const height = 120;
    const pixelData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const isChartPixel = x < 160 && y < 72;

        pixelData[index] = isChartPixel ? 31 : 255;
        pixelData[index + 1] = isChartPixel ? 41 : 255;
        pixelData[index + 2] = isChartPixel ? 55 : 255;
        pixelData[index + 3] = 255;
      }
    }

    const baseContext = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      drawImage: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      fillText: vi.fn(),
      font: "",
      getImageData: vi.fn(() => ({ data: pixelData })),
      restore: vi.fn(),
      roundRect: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: "",
    };
    const trimmedContext = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      drawImage: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: "",
      fillText: vi.fn(),
      font: "",
      getImageData: undefined,
      restore: vi.fn(),
      roundRect: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: "",
    };
    const baseCanvas = {
      getContext: vi.fn(() => baseContext),
      height: 0,
      style: {},
      toDataURL: vi.fn(() => "data:image/png;base64,BASE"),
      width: 0,
    };
    const trimmedCanvas = {
      getContext: vi.fn(() => trimmedContext),
      height: 0,
      style: {},
      toDataURL: vi.fn(() => "data:image/png;base64,TRIMMED_PADDED"),
      width: 0,
    };
    const createCanvas = vi
      .fn(() => baseCanvas as typeof baseCanvas | typeof trimmedCanvas)
      .mockReturnValueOnce(baseCanvas)
      .mockReturnValueOnce(trimmedCanvas);

    const dataUrl = await renderProjectPreviewExportModel(
      {
        background: "#ffffff",
        height,
        overlays: [],
        svgDataUrl: "data:image/svg+xml;charset=utf-8,%3Csvg%20/%3E",
        svgHeight: 72,
        svgWidth: 160,
        svgX: 0,
        svgY: 0,
        trailingPadding: {
          bottom: 24,
          right: 0,
        },
        width,
      },
      {
        createCanvas,
        loadSvgImage: async () =>
          ({ width: 160, height: 72 }) as CanvasImageSource,
        pixelRatio: 1,
      },
    );

    expect(dataUrl).toBe("data:image/png;base64,TRIMMED_PADDED");
    expect(trimmedCanvas.width).toBe(160);
    expect(trimmedCanvas.height).toBe(96);
  });
});
