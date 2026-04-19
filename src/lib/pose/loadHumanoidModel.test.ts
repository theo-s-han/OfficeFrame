import { describe, expect, it, vi } from "vitest";
import { getPoseHumanoidAssetCandidates } from "./humanoidAssets";
import { loadFirstHumanoidModel } from "./loadHumanoidModel";

describe("loadHumanoidModel", () => {
  it("returns the first loadable local human asset and records earlier failures", async () => {
    const candidates = getPoseHumanoidAssetCandidates();
    const loadCandidate = vi.fn(async (candidate) => {
      if (candidate.id === "osa-sample") {
        throw new Error("404");
      }

      return {
        assetKind: "gltf" as const,
        candidate,
        root: {} as never,
      };
    });

    const result = await loadFirstHumanoidModel(candidates, loadCandidate);

    expect(result.failures).toEqual([
      {
        candidate: candidates[0],
        message: "404",
      },
    ]);
    expect(result.model?.candidate.id).toBe("kenney-sample");
    expect(loadCandidate).toHaveBeenCalledTimes(2);
  });

  it("returns null when every candidate fails", async () => {
    const candidates = getPoseHumanoidAssetCandidates();

    const result = await loadFirstHumanoidModel(
      candidates,
      async (candidate) => {
        throw new Error(`${candidate.id}-missing`);
      },
    );

    expect(result.model).toBeNull();
    expect(result.failures.map((entry) => entry.message)).toEqual([
      "osa-sample-missing",
      "kenney-sample-missing",
      "makehuman-sample-missing",
    ]);
  });
});
