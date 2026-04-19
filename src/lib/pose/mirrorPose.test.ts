import { describe, expect, it } from "vitest";
import { createCharacterPoseSpec } from "./defaultPose";
import { mirrorCharacterPoseSpec } from "./mirrorPose";

describe("mirrorCharacterPoseSpec", () => {
  it("swaps left and right 2d joints across the canvas width", () => {
    const spec = createCharacterPoseSpec("pointing-right");
    const mirrored = mirrorCharacterPoseSpec(spec);

    expect(mirrored.preset).toBe("pointing-left");
    expect(mirrored.pose2d.leftWrist.x).toBeCloseTo(
      spec.canvas.width - spec.pose2d.rightWrist.x,
      3,
    );
    expect(mirrored.pose2d.rightWrist.x).toBeCloseTo(
      spec.canvas.width - spec.pose2d.leftWrist.x,
      3,
    );
  });
});
