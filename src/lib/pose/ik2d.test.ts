import { describe, expect, it } from "vitest";
import { getPointDistance, projectMidpointToTwoBoneChain, solveTwoBoneIK } from "./ik2d";

describe("pose ik2d", () => {
  it("clamps far targets to the maximum limb reach", () => {
    const result = solveTwoBoneIK(
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      100,
      100,
      1,
    );

    expect(result.end.x).toBeCloseTo(199.9999, 2);
    expect(result.end.y).toBeCloseTo(0, 2);
    expect(getPointDistance({ x: 0, y: 0 }, result.mid)).toBeCloseTo(100, 3);
    expect(getPointDistance(result.mid, result.end)).toBeCloseTo(100, 3);
  });

  it("keeps midpoints on the valid limb circles", () => {
    const midpoint = projectMidpointToTwoBoneChain(
      { x: 0, y: 0 },
      { x: 120, y: 60 },
      { x: 50, y: 30 },
      90,
      70,
      1,
    );

    expect(getPointDistance({ x: 0, y: 0 }, midpoint)).toBeCloseTo(90, 3);
    expect(getPointDistance(midpoint, { x: 120, y: 60 })).toBeCloseTo(70, 3);
  });
});
