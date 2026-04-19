import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import {
  VRMLoaderPlugin,
  VRMUtils,
  type VRM,
} from "@pixiv/three-vrm";
import type { PoseHumanoidAssetCandidate } from "./humanoidAssets";
import { logPoseDebug } from "./debug";

export type LoadedHumanoidModel = {
  assetKind: "vrm" | "gltf";
  candidate: PoseHumanoidAssetCandidate;
  root: THREE.Object3D;
  vrm?: VRM;
};

export type PoseHumanoidLoadFailure = {
  candidate: PoseHumanoidAssetCandidate;
  message: string;
};

function createLoader() {
  const loader = new GLTFLoader();

  loader.register((parser) => new VRMLoaderPlugin(parser));

  return loader;
}

export async function loadHumanoidModelCandidate(
  candidate: PoseHumanoidAssetCandidate,
): Promise<LoadedHumanoidModel> {
  const loader = createLoader();
  const gltf = await loader.loadAsync(candidate.path);
  const vrm = gltf.userData.vrm as VRM | undefined;
  const root = vrm?.scene ?? gltf.scene;

  if (!root) {
    throw new Error(`No scene was returned for ${candidate.path}`);
  }

  if (vrm) {
    VRMUtils.rotateVRM0(vrm);
  }

  root.traverse((object) => {
    object.frustumCulled = false;
  });
  root.updateMatrixWorld(true);

  return {
    assetKind: vrm ? "vrm" : "gltf",
    candidate,
    root,
    vrm,
  };
}

export async function loadFirstHumanoidModel(
  candidates: PoseHumanoidAssetCandidate[],
  loadCandidate: (
    candidate: PoseHumanoidAssetCandidate,
  ) => Promise<LoadedHumanoidModel> = loadHumanoidModelCandidate,
): Promise<{
  failures: PoseHumanoidLoadFailure[];
  model: LoadedHumanoidModel | null;
}> {
  const failures: PoseHumanoidLoadFailure[] = [];

  for (const candidate of candidates) {
    try {
      const model = await loadCandidate(candidate);

      logPoseDebug("humanoid-load-success", {
        assetKind: model.assetKind,
        candidateId: candidate.id,
        path: candidate.path,
      });

      return {
        failures,
        model,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown humanoid load error";

      failures.push({
        candidate,
        message,
      });

      logPoseDebug("humanoid-load-failure", {
        candidateId: candidate.id,
        message,
        path: candidate.path,
      });
    }
  }

  return {
    failures,
    model: null,
  };
}
