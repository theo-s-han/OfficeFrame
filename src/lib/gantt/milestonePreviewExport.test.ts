import { describe, expect, it, vi } from "vitest";
import {
  buildMilestonePreviewExportModel,
  exportMilestonePreviewImage,
} from "./milestonePreviewExport";

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

describe("milestone preview export", () => {
  it("builds an export model from the rendered Mermaid timeline svg", () => {
    document.body.innerHTML = `
      <div id="source">
        <div class="typed-gantt-preview typed-gantt-milestones">
          <section class="adapter-preview-section mermaid-kind-timeline">
            <h3>마일스톤 흐름</h3>
            <div class="mermaid-preview" style="background-color: rgb(255, 255, 255);">
              <svg xmlns="http://www.w3.org/2000/svg" width="680" height="360">
                <rect x="16" y="24" width="160" height="20" fill="rgb(91, 110, 225)" />
                <text x="24" y="38" fill="rgb(31, 41, 55)" style="font-size: 14px; font-weight: 700;">Kickoff</text>
              </svg>
            </div>
          </section>
        </div>
      </div>
    `;

    const source = document.getElementById("source");

    if (!source) {
      throw new Error("missing milestone export source");
    }

    mockRect(source, { left: 0, top: 0, width: 720, height: 420 });
    mockRect(source.querySelector(".adapter-preview-section"), {
      left: 0,
      top: 0,
      width: 720,
      height: 420,
    });
    mockRect(source.querySelector(".mermaid-preview"), {
      left: 0,
      top: 52,
      width: 720,
      height: 368,
    });
    mockRect(source.querySelector(".mermaid-preview svg"), {
      left: 18,
      top: 72,
      width: 680,
      height: 360,
    });

    const model = buildMilestonePreviewExportModel(source);

    expect(model.width).toBe(680);
    expect(model.height).toBe(360);
    expect(model.background).toBe("rgb(255, 255, 255)");
    expect(model.svgX).toBe(0);
    expect(model.svgY).toBe(0);
    expect(model.svgDataUrl).toContain("data:image/svg+xml");
    expect(decodeURIComponent(model.svgDataUrl)).toContain("<svg");
    expect(decodeURIComponent(model.svgDataUrl)).toContain("Kickoff");
  });

  it("renders the milestone svg export into a png data url", async () => {
    document.body.innerHTML = `
      <div id="source">
        <div class="typed-gantt-preview typed-gantt-milestones">
          <section class="adapter-preview-section mermaid-kind-timeline">
            <div class="mermaid-preview" style="background-color: rgb(255, 255, 255);">
              <svg xmlns="http://www.w3.org/2000/svg" width="680" height="360">
                <rect x="12" y="16" width="120" height="24" fill="rgb(91, 110, 225)" />
              </svg>
            </div>
          </section>
        </div>
      </div>
    `;

    const source = document.getElementById("source");

    if (!source) {
      throw new Error("missing milestone export source");
    }

    mockRect(source.querySelector(".mermaid-preview svg"), {
      left: 0,
      top: 0,
      width: 680,
      height: 360,
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
      toDataURL: vi.fn(() => "data:image/png;base64,MILESTONE_EXPORT_OK"),
      width: 0,
    };

    const dataUrl = await exportMilestonePreviewImage(source, {
      createCanvas: () => fakeCanvas,
      loadSvgImage: async () =>
        ({ width: 680, height: 360 }) as CanvasImageSource,
      pixelRatio: 1,
    });

    expect(dataUrl).toBe("data:image/png;base64,MILESTONE_EXPORT_OK");
    expect(fakeCanvas.width).toBe(680);
    expect(fakeCanvas.height).toBe(360);
    expect(fillRect).toHaveBeenCalledWith(0, 0, 680, 360);
    expect(drawImage).toHaveBeenCalled();
  });
});
