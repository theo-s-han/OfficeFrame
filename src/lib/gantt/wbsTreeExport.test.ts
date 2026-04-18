import { describe, expect, it, vi } from "vitest";
import {
  buildWbsTreePreviewExportModel,
  exportWbsTreePreviewImage,
} from "./wbsTreeExport";

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

describe("wbs tree preview export", () => {
  it("builds an export model from the WBS tree preview surface", () => {
    document.body.innerHTML = `
      <div id="source">
        <div class="typed-gantt-preview typed-gantt-wbs">
          <div class="wbs-tree-surface" style="background-color: rgb(255, 255, 255);">
            <div class="wbs-tree-canvas">
              <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520">
                <path class="wbs-tree-link" d="M20,20 L80,80" stroke="rgb(152, 162, 179)" fill="none" />
                <rect x="320" y="40" width="240" height="112" rx="8" fill="rgb(255, 255, 255)" stroke="rgb(230, 232, 236)" />
                <text x="340" y="86" fill="rgb(31, 41, 55)">1 요구 분석</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;

    const source = document.getElementById("source");

    if (!source) {
      throw new Error("missing wbs export source");
    }

    mockRect(source, { left: 0, top: 0, width: 980, height: 620 });
    mockRect(source.querySelector(".wbs-tree-surface"), {
      left: 0,
      top: 0,
      width: 980,
      height: 620,
    });
    mockRect(source.querySelector(".wbs-tree-surface svg"), {
      left: 24,
      top: 24,
      width: 900,
      height: 520,
    });

    const model = buildWbsTreePreviewExportModel(source);

    expect(model.width).toBe(980);
    expect(model.height).toBe(620);
    expect(model.background).toBe("rgb(255, 255, 255)");
    expect(model.svgX).toBe(24);
    expect(model.svgY).toBe(24);
    expect(decodeURIComponent(model.svgDataUrl)).toContain("<svg");
    expect(decodeURIComponent(model.svgDataUrl)).toContain("요구 분석");
  });

  it("renders the WBS tree export into a png data url", async () => {
    document.body.innerHTML = `
      <div id="source">
        <div class="typed-gantt-preview typed-gantt-wbs">
          <div class="wbs-tree-surface" style="background-color: rgb(255, 255, 255);">
            <div class="wbs-tree-canvas">
              <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520">
                <rect x="320" y="40" width="240" height="112" rx="8" fill="rgb(255, 255, 255)" stroke="rgb(230, 232, 236)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    `;

    const source = document.getElementById("source");

    if (!source) {
      throw new Error("missing wbs export source");
    }

    mockRect(source.querySelector(".wbs-tree-surface"), {
      left: 0,
      top: 0,
      width: 980,
      height: 620,
    });
    mockRect(source.querySelector(".wbs-tree-surface svg"), {
      left: 24,
      top: 24,
      width: 900,
      height: 520,
    });

    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const fakeContext = {
      arc: vi.fn(),
      beginPath: vi.fn(),
      drawImage,
      fill: vi.fn(),
      fillRect,
      fillStyle: "",
      fillText: vi.fn(),
      font: "",
      restore: vi.fn(),
      roundRect: vi.fn(),
      save: vi.fn(),
      scale: vi.fn(),
      stroke: vi.fn(),
      strokeStyle: "",
    };
    const fakeCanvas = {
      getContext: vi.fn(() => fakeContext),
      height: 0,
      style: {},
      toDataURL: vi.fn(() => "data:image/png;base64,WBS_TREE_EXPORT_OK"),
      width: 0,
    };

    const dataUrl = await exportWbsTreePreviewImage(source, {
      createCanvas: () => fakeCanvas,
      loadSvgImage: async () =>
        ({ width: 900, height: 520 }) as CanvasImageSource,
      pixelRatio: 1,
    });

    expect(dataUrl).toBe("data:image/png;base64,WBS_TREE_EXPORT_OK");
    expect(fakeCanvas.width).toBe(980);
    expect(fakeCanvas.height).toBe(620);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 980, 620);
    expect(drawImage).toHaveBeenCalled();
  });
});

