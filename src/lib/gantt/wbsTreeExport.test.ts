import { beforeEach, describe, expect, it, vi } from "vitest";
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

function createFakeCanvas(dataUrl: string) {
  const drawImage = vi.fn();
  const fillRect = vi.fn();
  const scale = vi.fn();
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
    scale,
    stroke: vi.fn(),
    strokeStyle: "",
  };
  const fakeCanvas = {
    getContext: vi.fn(() => fakeContext),
    height: 0,
    style: {},
    toDataURL: vi.fn(() => dataUrl),
    width: 0,
  };

  return {
    drawImage,
    fakeCanvas,
    fillRect,
    scale,
  };
}

function createWbsPreviewMarkup() {
  document.body.innerHTML = `
    <div id="source">
      <div class="typed-gantt-preview typed-gantt-wbs">
        <div class="wbs-tree-surface" style="background-color: rgb(255, 255, 255);">
          <div class="wbs-tree-canvas">
            <svg xmlns="http://www.w3.org/2000/svg" width="900" height="520">
              <g class="rd3t-g rd3t-g-test" transform="translate(140,44) scale(1.9)">
                <path class="wbs-tree-link" d="M20,20 L80,80" stroke="rgb(152, 162, 179)" fill="none" />
                <rect x="320" y="40" width="240" height="112" rx="8" fill="rgb(255, 255, 255)" stroke="rgb(230, 232, 236)" />
                <text x="340" y="86" fill="rgb(31, 41, 55)">1 요구 분석</text>
              </g>
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

  const treeGroup = source.querySelector(".rd3t-g");

  if (!treeGroup) {
    throw new Error("missing wbs tree group");
  }

  Object.defineProperty(treeGroup, "getBBox", {
    configurable: true,
    value: () => ({
      height: 520,
      width: 1240,
      x: -620,
      y: 0,
    }),
  });

  return source;
}

describe("wbs tree preview export", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds an export model from the tree content bounds so wide charts are not clipped", () => {
    const source = createWbsPreviewMarkup();
    const model = buildWbsTreePreviewExportModel(source);

    expect(model.width).toBe(1364);
    expect(model.height).toBe(596);
    expect(model.background).toBe("rgb(255, 255, 255)");
    expect(model.svgX).toBe(0);
    expect(model.svgY).toBe(0);
    expect(model.trailingPadding).toEqual({
      bottom: 50,
      right: 62,
    });
    expect(decodeURIComponent(model.svgDataUrl)).toContain("<svg");
    expect(decodeURIComponent(model.svgDataUrl)).toContain(
      'transform="translate(682,26) scale(1)"',
    );
    expect(decodeURIComponent(model.svgDataUrl)).toContain(
      'viewBox="0 0 1364 596"',
    );
    expect(decodeURIComponent(model.svgDataUrl)).toContain("요구 분석");
  });

  it("renders the fitted WBS preview svg model into a png data url", async () => {
    const source = createWbsPreviewMarkup();
    const { drawImage, fakeCanvas, fillRect, scale } = createFakeCanvas(
      "data:image/png;base64,WBS_TREE_SVG_EXPORT_OK",
    );

    const dataUrl = await exportWbsTreePreviewImage(source, {
      createCanvas: () => fakeCanvas,
      loadSvgImage: async () =>
        ({ width: 1364, height: 596 }) as CanvasImageSource,
      pixelRatio: 1,
    });

    expect(dataUrl).toBe("data:image/png;base64,WBS_TREE_SVG_EXPORT_OK");
    expect(fakeCanvas.width).toBe(1364);
    expect(fakeCanvas.height).toBe(596);
    expect(scale).toHaveBeenCalledWith(1, 1);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 1364, 596);
    expect(drawImage).toHaveBeenCalledWith(
      expect.any(Object),
      0,
      0,
      1364,
      596,
    );
  });

  it("falls back to exporting the fitted clone when svg rendering fails", async () => {
    const source = createWbsPreviewMarkup();
    const toPngImpl = vi.fn(
      async () => "data:image/png;base64,WBS_TREE_DOM_FALLBACK_EXPORT_OK",
    );

    const dataUrl = await exportWbsTreePreviewImage(source, {
      loadSvgImage: async () =>
        Promise.reject(new Error("svg rendering failed")),
      pixelRatio: 1,
      toPngImpl,
    });

    expect(dataUrl).toBe("data:image/png;base64,WBS_TREE_DOM_FALLBACK_EXPORT_OK");
    expect(toPngImpl).toHaveBeenCalledTimes(1);
    const firstCall = toPngImpl.mock.calls.at(0) as
      | [HTMLElement, Record<string, unknown>]
      | undefined;

    if (!firstCall) {
      throw new Error("missing fallback export node");
    }

    const [exportNode] = firstCall;

    expect(exportNode.querySelector("svg")?.getAttribute("viewBox")).toBe(
      "0 0 1364 596",
    );
    expect(exportNode.querySelector(".rd3t-g")?.getAttribute("transform")).toBe(
      "translate(682,26) scale(1)",
    );
    expect(toPngImpl).toHaveBeenCalledWith(
      exportNode,
      expect.objectContaining({
        backgroundColor: "rgb(255, 255, 255)",
        height: 596,
        pixelRatio: 1,
        width: 1364,
      }),
    );
  });
});
