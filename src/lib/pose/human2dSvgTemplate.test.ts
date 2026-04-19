import { describe, expect, it } from "vitest";
import {
  applyHuman2DSvgTokenMap,
  createHuman2DSvgDataUrl,
  createHuman2DSvgTokenMap,
} from "./human2dSvgTemplate";

describe("human2dSvgTemplate", () => {
  it("builds deterministic color tokens from the human model colors", () => {
    const tokenMap = createHuman2DSvgTokenMap({
      skinColor: "#E2B79B",
      clothColor: "#5B6EE1",
      hairColor: "#2C3340",
      accentColor: "#2F7E9E",
    });

    expect(tokenMap.__SKIN__).toBe("#E2B79B");
    expect(tokenMap.__CLOTH__).toBe("#5B6EE1");
    expect(tokenMap.__HAIR__).toBe("#2C3340");
    expect(tokenMap.__ACCENT__).toBe("#2F7E9E");
    expect(tokenMap.__CLOTH_SHADE__).not.toBe(tokenMap.__CLOTH__);
    expect(tokenMap.__ACCENT_LIGHT__).not.toBe(tokenMap.__ACCENT__);
  });

  it("replaces svg color tokens and returns a data url", () => {
    const svg = "<svg><rect fill='__CLOTH__'/><circle fill='__SKIN__'/></svg>";
    const tokenMap = createHuman2DSvgTokenMap({
      skinColor: "#F1C3A8",
      clothColor: "#4E8B63",
      hairColor: "#111827",
      accentColor: "#A07A2E",
    });

    const populatedSvg = applyHuman2DSvgTokenMap(svg, tokenMap);

    expect(populatedSvg).toContain("#4E8B63");
    expect(populatedSvg).toContain("#F1C3A8");
    expect(populatedSvg).not.toContain("__CLOTH__");
    expect(populatedSvg).not.toContain("__SKIN__");

    const dataUrl = createHuman2DSvgDataUrl(svg, tokenMap);

    expect(dataUrl.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decodeURIComponent(dataUrl.split(",", 2)[1] ?? "")).toContain(
      "#4E8B63",
    );
  });
});
