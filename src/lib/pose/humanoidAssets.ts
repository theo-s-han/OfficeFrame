export type PoseHumanoidAssetKind = "vrm" | "gltf";

export type PoseHumanoidAssetCandidate = {
  id: "osa-sample" | "kenney-sample" | "makehuman-sample";
  kind: PoseHumanoidAssetKind;
  label: string;
  path: string;
};

export const poseHumanoidAssetCandidates: PoseHumanoidAssetCandidate[] = [
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
];

export function getPoseHumanoidAssetCandidates() {
  return [...poseHumanoidAssetCandidates];
}

export function getPoseHumanoidAssetFolderPath() {
  return "/assets/pose/models/human/";
}

export function getPoseHumanoidAssetReadmePath() {
  return "/assets/pose/models/human/README.md";
}
