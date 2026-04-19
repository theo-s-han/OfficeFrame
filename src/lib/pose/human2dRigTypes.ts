export type Human2DCharacterStyle =
  | "builtin-cartoon"
  | "open-peeps"
  | "humaaans"
  | "kenney"
  | "custom";

export type Human2DAssetFormat = "builtin" | "segmented-svg" | "segmented-png";

export type Human2DPartKind =
  | "head"
  | "hair"
  | "face"
  | "neck"
  | "torso"
  | "upperArm"
  | "lowerArm"
  | "hand"
  | "upperLeg"
  | "lowerLeg"
  | "foot"
  | "accessory";

export type Human2DJointId =
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

export type Human2DPartRenderMode = "anchored" | "between-joints";

export type Human2DPartDefinition = {
  id: string;
  kind: Human2DPartKind;
  src?: string;
  renderMode: Human2DPartRenderMode;
  fromJoint?: Human2DJointId;
  toJoint?: Human2DJointId;
  anchorJoint?: Human2DJointId;
  width: number;
  height: number;
  pivot: { x: number; y: number };
  offset?: { x: number; y: number };
  zIndex: number;
  mirrorX?: boolean;
  tintRole?: "skin" | "cloth" | "hair" | "accent" | "none";
};

export type Human2DCharacterAsset = {
  id: string;
  label: string;
  style: Human2DCharacterStyle;
  format: Human2DAssetFormat;
  license: string;
  sourceName: string;
  sourceUrl?: string;
  attributionRequired: boolean;
  parts: Human2DPartDefinition[];
};

export type Human2DModelState = {
  assetId: string;
  style: Human2DCharacterStyle;
  showCharacter: boolean;
  showSkeleton: boolean;
  showJointHandles: boolean;
  skinColor: string;
  clothColor: string;
  hairColor: string;
  accentColor: string;
};

export type Human2DAssetManifestEntry = {
  rig: string;
};

export type Human2DAssetManifest = {
  assets?: Human2DAssetManifestEntry[];
};
