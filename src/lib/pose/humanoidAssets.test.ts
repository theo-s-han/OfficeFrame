import { describe, expect, it } from "vitest";
import {
  getPoseHumanoidAssetCandidates,
  getPoseHumanoidAssetFolderPath,
  getPoseHumanoidAssetReadmePath,
} from "./humanoidAssets";

describe("humanoidAssets", () => {
  it("keeps the local humanoid asset candidates in deterministic order", () => {
    expect(getPoseHumanoidAssetCandidates()).toEqual([
      {
        id: "osa-sample",
        kind: "vrm",
        label: "OSA Sample VRM",
        path: "/assets/pose/models/human/osa-sample.vrm",
      },
      {
        id: "kenney-sample",
        kind: "gltf",
        label: "Kenney Sample GLB",
        path: "/assets/pose/models/human/kenney-sample.glb",
      },
      {
        id: "makehuman-sample",
        kind: "gltf",
        label: "MakeHuman Sample GLB",
        path: "/assets/pose/models/human/makehuman-sample.glb",
      },
    ]);
  });

  it("exposes the shared local asset folder and README path", () => {
    expect(getPoseHumanoidAssetFolderPath()).toBe("/assets/pose/models/human/");
    expect(getPoseHumanoidAssetReadmePath()).toBe(
      "/assets/pose/models/human/README.md",
    );
  });
});
