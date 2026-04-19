import { describe, expect, it } from "vitest";
import { validateHuman2DAsset } from "./validateHuman2DAsset";
import manifestJson from "../../../public/assets/pose/2d/human/manifest.json";
import openPeepsLiteRigJson from "../../../public/assets/pose/2d/human/open-peeps-lite/rig.json";

const validAsset = {
  id: "basic-cartoon-svg",
  label: "Basic Cartoon SVG Human",
  style: "custom",
  format: "segmented-svg",
  license: "Internal placeholder asset.",
  sourceName: "Generated in project",
  attributionRequired: false,
  parts: [
    {
      id: "torso",
      kind: "torso",
      src: "/assets/pose/2d/human/basic-cartoon/torso.svg",
      renderMode: "anchored",
      anchorJoint: "chest",
      width: 110,
      height: 150,
      pivot: { x: 55, y: 30 },
      zIndex: 20,
      tintRole: "cloth",
    },
  ],
};

describe("validateHuman2DAsset", () => {
  it("accepts the shipped Open Peeps Lite segmented rig", () => {
    expect(validateHuman2DAsset(openPeepsLiteRigJson)).toHaveLength(0);
  });

  it("registers the Open Peeps Lite segmented rig in the public manifest", () => {
    expect(manifestJson.assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          rig: "/assets/pose/2d/human/open-peeps-lite/rig.json",
        }),
      ]),
    );
  });

  it("accepts a valid same-origin asset definition", () => {
    expect(validateHuman2DAsset(validAsset)).toHaveLength(0);
  });

  it("rejects non-local part sources", () => {
    expect(
      validateHuman2DAsset({
        ...validAsset,
        parts: [
          {
            ...validAsset.parts[0],
            src: "https://example.com/torso.svg",
          },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "asset.parts[0].src" }),
      ]),
    );
  });

  it("rejects duplicate part ids and missing joint bindings", () => {
    expect(
      validateHuman2DAsset({
        ...validAsset,
        parts: [
          {
            id: "limb",
            kind: "upperArm",
            src: "/assets/pose/2d/human/basic-cartoon/upper-arm.svg",
            renderMode: "between-joints",
            width: 36,
            height: 100,
            pivot: { x: 18, y: 8 },
            zIndex: 10,
          },
          {
            ...validAsset.parts[0],
            id: "limb",
          },
        ],
      }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "between-joints part requires fromJoint and toJoint",
        }),
        expect.objectContaining({ message: "part id must be unique" }),
      ]),
    );
  });
});
