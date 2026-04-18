import { describe, expect, it } from "vitest";
import {
  inlineSvgPresentationStyles,
  stabilizeSvgAnimations,
} from "./svgExport";

describe("stabilizeSvgAnimations", () => {
  it("applies the target value and removes svg animate nodes", () => {
    document.body.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg">
        <rect class="bar" width="24" height="16">
          <animate attributeName="width" from="0" to="128" />
        </rect>
      </svg>
    `;

    const root = document.body;
    const rect = root.querySelector("rect");

    stabilizeSvgAnimations(root);

    expect(rect?.getAttribute("width")).toBe("128");
    expect(root.querySelector("animate")).toBeNull();
  });

  it("copies svg presentation styles and keeps grid background transparent", () => {
    document.body.innerHTML = `
      <div id="source-root">
        <svg xmlns="http://www.w3.org/2000/svg">
          <rect class="grid-background" style="fill: rgb(0, 0, 0)" />
          <rect class="bar" style="fill: rgb(91, 110, 225); stroke: rgb(84, 101, 207); stroke-width: 0.8" />
        </svg>
      </div>
      <div id="clone-root">
        <svg xmlns="http://www.w3.org/2000/svg">
          <rect class="grid-background" />
          <rect class="bar" />
        </svg>
      </div>
    `;

    const sourceRoot = document.getElementById("source-root");
    const cloneRoot = document.getElementById("clone-root");
    const cloneBar = cloneRoot?.querySelector<SVGElement>(".bar");
    const cloneBackground =
      cloneRoot?.querySelector<SVGElement>(".grid-background");

    if (!sourceRoot || !cloneRoot || !cloneBar || !cloneBackground) {
      throw new Error("test setup failed");
    }

    inlineSvgPresentationStyles(sourceRoot, cloneRoot);

    expect(cloneBar.style.fill).toBe("rgb(91, 110, 225)");
    expect(cloneBar.style.stroke).toBe("rgb(84, 101, 207)");
    expect(cloneBar.style.strokeWidth).toBe("0.8");
    expect(cloneBackground.getAttribute("fill")).toBe("none");
    expect(cloneBackground.style.fill).toBe("none");
  });
});
