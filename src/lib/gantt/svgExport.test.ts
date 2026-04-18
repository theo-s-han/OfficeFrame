import { describe, expect, it } from "vitest";
import { stabilizeSvgAnimations } from "./svgExport";

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
});
