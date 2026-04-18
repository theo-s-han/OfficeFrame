import { describe, expect, it } from "vitest";
import {
  createGanttProgressColors,
  darkenHexColor,
  normalizeHexColor,
  tintHexColor,
} from "./progressColors";

describe("gantt progress color utilities", () => {
  it("normalizes hex colors and falls back to enterprise indigo", () => {
    expect(normalizeHexColor("#5b6ee1")).toBe("#5B6EE1");
    expect(normalizeHexColor("not-a-color")).toBe("#5B6EE1");
  });

  it("creates darker progress and pale remaining colors from the same hue", () => {
    expect(darkenHexColor("#5B6EE1", 0.14)).toBe("#4E5FC2");
    expect(tintHexColor("#5B6EE1", 0.88)).toBe("#EBEEFB");
    expect(createGanttProgressColors("#5B6EE1")).toMatchObject({
      baseColor: "#5B6EE1",
      progressColor: "#4E5FC2",
      remainingColor: "#EBEEFB",
      borderColor: "#5465CF",
    });
  });
});
