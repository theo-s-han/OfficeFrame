import { describe, expect, it } from "vitest";
import {
  HUMAN_2D_CHARACTER_ASSETS,
  HUMAN_2D_ASSET_MANIFEST_PATH,
  createDefaultHuman2DModelState,
  loadHuman2DAssetCatalog,
} from "./human2dAssets";

describe("human2dAssets", () => {
  it("ships at least four studio-quality selectable human characters", () => {
    expect(
      HUMAN_2D_CHARACTER_ASSETS.map((asset) => asset.id),
    ).toEqual(
      expect.arrayContaining([
        "studio-office",
        "studio-casual",
        "studio-hero",
        "studio-neutral",
      ]),
    );
  });

  it("creates a stable default 2D human model state", () => {
    expect(createDefaultHuman2DModelState()).toEqual({
      assetId: "studio-office",
      style: "custom",
      showCharacter: true,
      showSkeleton: false,
      showJointHandles: true,
      skinColor: "#E2B79B",
      clothColor: "#5B6EE1",
      hairColor: "#2C3340",
      accentColor: "#2F7E9E",
    });
  });

  it("loads additional assets from the manifest and preserves built-ins", async () => {
    const rig = {
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
    const responses = new Map<string, unknown>([
      [
        HUMAN_2D_ASSET_MANIFEST_PATH,
        {
          assets: [{ rig: "/assets/pose/2d/human/basic-cartoon/rig.json" }],
        },
      ],
      ["/assets/pose/2d/human/basic-cartoon/rig.json", rig],
    ]);

    const result = await loadHuman2DAssetCatalog(async (input) => {
      const payload = responses.get(input);

      if (!payload) {
        return {
          ok: false,
          status: 404,
          json: async () => ({}),
        };
      }

      return {
        ok: true,
        status: 200,
        json: async () => payload,
      };
    });

    expect(result.warnings).toHaveLength(0);
    expect(result.assets.map((asset) => asset.id)).toEqual(
      expect.arrayContaining(["studio-office", "basic-cartoon-svg"]),
    );
  });

  it("reports warnings for invalid manifest entries", async () => {
    const result = await loadHuman2DAssetCatalog(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        assets: [{ rig: "" }, { rig: "/assets/invalid.json" }],
      }),
    }));

    expect(result.assets.map((asset) => asset.id)).toContain("studio-office");
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        "Skipped an invalid 2D human manifest entry.",
        "Skipped /assets/invalid.json because the rig definition is invalid.",
      ]),
    );
  });
});
