import { describe, expect, it, vi } from "vitest";
import {
  getTimelinePreviewVisualSize,
  hasVisibleTimelinePreviewNodes,
} from "./previewMetrics";

describe("timeline preview metrics", () => {
  it("falls back to the root size when no visible timeline nodes exist", () => {
    const root = document.createElement("div");

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      width: 420,
      height: 260,
      top: 0,
      left: 0,
      right: 420,
      bottom: 260,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    expect(getTimelinePreviewVisualSize(root)).toEqual({
      width: 420,
      height: 260,
    });
  });

  it("captures the full rendered bounds of visible timeline elements", () => {
    document.body.innerHTML = `
      <div id="root">
        <div class="timeline-preview-title"></div>
        <div class="timeline-preview-card"></div>
      </div>
    `;

    const root = document.getElementById("root") as HTMLElement;
    const title = root.querySelector(".timeline-preview-title") as HTMLElement;
    const card = root.querySelector(".timeline-preview-card") as HTMLElement;

    vi.spyOn(root, "getBoundingClientRect").mockReturnValue({
      width: 960,
      height: 640,
      top: 0,
      left: 0,
      right: 960,
      bottom: 640,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(title, "getBoundingClientRect").mockReturnValue({
      width: 96,
      height: 40,
      top: 24,
      left: 24,
      right: 120,
      bottom: 64,
      x: 24,
      y: 24,
      toJSON: () => ({}),
    });
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      width: 412,
      height: 188,
      top: 112,
      left: 420,
      right: 832,
      bottom: 300,
      x: 420,
      y: 112,
      toJSON: () => ({}),
    });

    expect(getTimelinePreviewVisualSize(root)).toEqual({
      width: 832,
      height: 300,
    });
  });

  it("detects whether visible timeline nodes exist", () => {
    document.body.innerHTML = `
      <div id="root">
        <div class="timeline-preview-title"></div>
      </div>
    `;

    const root = document.getElementById("root") as HTMLElement;
    const title = root.querySelector(".timeline-preview-title") as HTMLElement;

    vi.spyOn(title, "getBoundingClientRect").mockReturnValue({
      width: 96,
      height: 40,
      top: 24,
      left: 24,
      right: 120,
      bottom: 64,
      x: 24,
      y: 24,
      toJSON: () => ({}),
    });

    expect(hasVisibleTimelinePreviewNodes(root)).toBe(true);
  });
});
