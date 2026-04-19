import { describe, expect, it } from "vitest";
import { createCharacterPoseSpec } from "./defaultPose";
import { parsePoseSpecJson, validatePoseSpec } from "./validatePoseSpec";

describe("validatePoseSpec", () => {
  it("accepts the default pose spec", () => {
    const spec = createCharacterPoseSpec("standing");

    expect(validatePoseSpec(spec)).toHaveLength(0);
    expect(spec.human2dModel?.assetId).toBe("studio-office");
  });

  it("rejects invalid canvas ranges", () => {
    const spec = createCharacterPoseSpec("standing");
    spec.canvas.width = 120;
    spec.canvas.exportPixelRatio = 8;

    expect(validatePoseSpec(spec)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "canvas.width" }),
        expect.objectContaining({ path: "canvas.exportPixelRatio" }),
      ]),
    );
  });

  it("reports malformed json during import", () => {
    const result = parsePoseSpecJson("{bad json}");

    expect(result.spec).toBeNull();
    expect(result.issues[0]?.path).toBe("json");
  });

  it("rejects invalid human2dModel fields", () => {
    const spec = createCharacterPoseSpec("standing");

    spec.human2dModel = {
      ...spec.human2dModel,
      style: "invalid-style",
      accentColor: "not-a-color",
    } as never;

    expect(validatePoseSpec(spec)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "human2dModel.style" }),
        expect.objectContaining({ path: "human2dModel.accentColor" }),
      ]),
    );
  });
});
