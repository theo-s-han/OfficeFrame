import { describe, expect, it } from "vitest";
import {
  getAngleRadians,
  getDistance,
  getSegmentTransform,
  radiansToDegrees,
} from "./human2dRenderMath";

describe("human2dRenderMath", () => {
  it("calculates distance and angle between two points", () => {
    expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(radiansToDegrees(getAngleRadians({ x: 0, y: 0 }, { x: 0, y: 10 }))).toBe(
      90,
    );
  });

  it("returns a segment transform that starts at the from point", () => {
    expect(
      getSegmentTransform({
        from: { x: 20, y: 40 },
        to: { x: 20, y: 140 },
        sourceHeight: 100,
        pivot: { x: 10, y: 0 },
      }),
    ).toEqual({
      x: 20,
      y: 40,
      rotationDeg: 0,
      scaleY: 1,
    });
  });

  it("clamps scaleY to the supported range", () => {
    expect(
      getSegmentTransform({
        from: { x: 0, y: 0 },
        to: { x: 0, y: 300 },
        sourceHeight: 100,
        pivot: { x: 18, y: 0 },
      }).scaleY,
    ).toBe(1.6);

    expect(
      getSegmentTransform({
        from: { x: 0, y: 0 },
        to: { x: 0, y: 20 },
        sourceHeight: 100,
        pivot: { x: 18, y: 0 },
      }).scaleY,
    ).toBe(0.6);
  });
});
