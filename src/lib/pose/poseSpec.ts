import type { Human2DModelState } from "./human2dRigTypes";

export type PoseMode = "2d" | "3d";

export type PosePreset =
  | "standing"
  | "arms-up"
  | "pointing-right"
  | "pointing-left"
  | "presenting"
  | "walking"
  | "sitting-lite";

export type CanvasBackground = "transparent" | "white" | "grid";

export type PoseAppearance = {
  bodyStyle: "neutral" | "slim" | "broad";
  skinColor: string;
  clothColor: string;
  accentColor: string;
  strokeWidth: number;
  showJointHandles: boolean;
  showSkeleton: boolean;
};

export type PoseCanvas = {
  width: number;
  height: number;
  background: CanvasBackground;
  exportPixelRatio: number;
};

export type Joint2D =
  | "head"
  | "neck"
  | "chest"
  | "pelvis"
  | "leftShoulder"
  | "leftElbow"
  | "leftWrist"
  | "rightShoulder"
  | "rightElbow"
  | "rightWrist"
  | "leftHip"
  | "leftKnee"
  | "leftAnkle"
  | "rightHip"
  | "rightKnee"
  | "rightAnkle";

export type Point2D = {
  x: number;
  y: number;
};

export type Pose2D = Record<Joint2D, Point2D>;

export type Joint3D =
  | "neck"
  | "chest"
  | "pelvis"
  | "leftShoulder"
  | "leftElbow"
  | "rightShoulder"
  | "rightElbow"
  | "leftHip"
  | "leftKnee"
  | "rightHip"
  | "rightKnee";

export type EulerRotation = {
  x: number;
  y: number;
  z: number;
};

export type Pose3D = Record<Joint3D, EulerRotation>;

export type CharacterPoseSpec = {
  type: "character-pose";
  version: 1;
  mode: PoseMode;
  preset: PosePreset;
  canvas: PoseCanvas;
  appearance: PoseAppearance;
  pose2d: Pose2D;
  pose3d: Pose3D;
  human2dModel?: Human2DModelState;
};

export const posePresetOptions: Array<{ label: string; value: PosePreset }> = [
  { label: "서기", value: "standing" },
  { label: "양팔 들기", value: "arms-up" },
  { label: "오른쪽 가리키기", value: "pointing-right" },
  { label: "왼쪽 가리키기", value: "pointing-left" },
  { label: "발표", value: "presenting" },
  { label: "걷기", value: "walking" },
  { label: "가볍게 앉기", value: "sitting-lite" },
];

export const canvasBackgroundOptions: Array<{
  label: string;
  value: CanvasBackground;
}> = [
  { label: "투명", value: "transparent" },
  { label: "흰색", value: "white" },
  { label: "그리드", value: "grid" },
];

export const pose2dJointOptions: Array<{ label: string; value: Joint2D }> = [
  { label: "머리", value: "head" },
  { label: "목", value: "neck" },
  { label: "가슴", value: "chest" },
  { label: "골반", value: "pelvis" },
  { label: "왼쪽 어깨", value: "leftShoulder" },
  { label: "왼쪽 팔꿈치", value: "leftElbow" },
  { label: "왼쪽 손목", value: "leftWrist" },
  { label: "오른쪽 어깨", value: "rightShoulder" },
  { label: "오른쪽 팔꿈치", value: "rightElbow" },
  { label: "오른쪽 손목", value: "rightWrist" },
  { label: "왼쪽 엉덩이", value: "leftHip" },
  { label: "왼쪽 무릎", value: "leftKnee" },
  { label: "왼쪽 발목", value: "leftAnkle" },
  { label: "오른쪽 엉덩이", value: "rightHip" },
  { label: "오른쪽 무릎", value: "rightKnee" },
  { label: "오른쪽 발목", value: "rightAnkle" },
];

export const pose3dJointOptions: Array<{ label: string; value: Joint3D }> = [
  { label: "목", value: "neck" },
  { label: "가슴", value: "chest" },
  { label: "골반", value: "pelvis" },
  { label: "왼쪽 어깨", value: "leftShoulder" },
  { label: "왼쪽 팔꿈치", value: "leftElbow" },
  { label: "오른쪽 어깨", value: "rightShoulder" },
  { label: "오른쪽 팔꿈치", value: "rightElbow" },
  { label: "왼쪽 엉덩이", value: "leftHip" },
  { label: "왼쪽 무릎", value: "leftKnee" },
  { label: "오른쪽 엉덩이", value: "rightHip" },
  { label: "오른쪽 무릎", value: "rightKnee" },
];

export const pose2dJointKeys = pose2dJointOptions.map(
  (option) => option.value,
) as Joint2D[];

export const pose3dJointKeys = pose3dJointOptions.map(
  (option) => option.value,
) as Joint3D[];

export const poseDraggable2dJoints: Joint2D[] = [
  "head",
  "leftElbow",
  "leftWrist",
  "rightElbow",
  "rightWrist",
  "leftKnee",
  "leftAnkle",
  "rightKnee",
  "rightAnkle",
];

export const poseHandleJoints3d: Joint3D[] = [...pose3dJointKeys];
