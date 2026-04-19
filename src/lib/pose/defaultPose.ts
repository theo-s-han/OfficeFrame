import { createDefaultHuman2DModelState } from "./human2dAssets";
import {
  type CanvasBackground,
  type CharacterPoseSpec,
  type EulerRotation,
  type Joint2D,
  type Joint3D,
  type Point2D,
  type Pose2D,
  type Pose3D,
  type PoseAppearance,
  type PoseCanvas,
  type PosePreset,
  pose2dJointKeys,
  pose3dJointKeys,
} from "./poseSpec";

export const defaultPoseCanvas: PoseCanvas = {
  width: 900,
  height: 700,
  background: "grid",
  exportPixelRatio: 2,
};

export const defaultPoseAppearance: PoseAppearance = {
  bodyStyle: "neutral",
  skinColor: "#E2B79B",
  clothColor: "#5B6EE1",
  accentColor: "#2F7E9E",
  strokeWidth: 10,
  showJointHandles: true,
  showSkeleton: false,
};

function createPoint(x: number, y: number): Point2D {
  return { x, y };
}

function createRotation(x = 0, y = 0, z = 0): EulerRotation {
  return { x, y, z };
}

export function clonePose2D(pose: Pose2D): Pose2D {
  return pose2dJointKeys.reduce((result, joint) => {
    result[joint] = { ...pose[joint] };
    return result;
  }, {} as Pose2D);
}

export function clonePose3D(pose: Pose3D): Pose3D {
  return pose3dJointKeys.reduce((result, joint) => {
    result[joint] = { ...pose[joint] };
    return result;
  }, {} as Pose3D);
}

export function createStandingPose2D(): Pose2D {
  return {
    head: createPoint(450, 108),
    neck: createPoint(450, 168),
    chest: createPoint(450, 238),
    pelvis: createPoint(450, 342),
    leftShoulder: createPoint(392, 232),
    leftElbow: createPoint(346, 308),
    leftWrist: createPoint(322, 390),
    rightShoulder: createPoint(508, 232),
    rightElbow: createPoint(554, 308),
    rightWrist: createPoint(578, 390),
    leftHip: createPoint(414, 344),
    leftKnee: createPoint(392, 468),
    leftAnkle: createPoint(382, 596),
    rightHip: createPoint(486, 344),
    rightKnee: createPoint(508, 468),
    rightAnkle: createPoint(518, 596),
  };
}

export function createStandingPose3D(): Pose3D {
  return {
    neck: createRotation(),
    chest: createRotation(),
    pelvis: createRotation(),
    leftShoulder: createRotation(0.1, 0, 0.08),
    leftElbow: createRotation(0.12, 0, 0),
    rightShoulder: createRotation(0.1, 0, -0.08),
    rightElbow: createRotation(0.12, 0, 0),
    leftHip: createRotation(-0.04, 0, 0.05),
    leftKnee: createRotation(0.08, 0, 0),
    rightHip: createRotation(-0.04, 0, -0.05),
    rightKnee: createRotation(0.08, 0, 0),
  };
}

export function createCharacterPoseSpec(
  preset: PosePreset,
  options?: {
    appearance?: PoseAppearance;
    background?: CanvasBackground;
    canvas?: Partial<PoseCanvas>;
    human2dModel?: CharacterPoseSpec["human2dModel"];
    mode?: CharacterPoseSpec["mode"];
    pose2d?: Pose2D;
    pose3d?: Pose3D;
  },
): CharacterPoseSpec {
  const appearance = options?.appearance
    ? { ...options.appearance }
    : { ...defaultPoseAppearance };

  return {
    type: "character-pose",
    version: 1,
    mode: options?.mode ?? "2d",
    preset,
    canvas: {
      ...defaultPoseCanvas,
      ...options?.canvas,
      background:
        options?.background ??
        options?.canvas?.background ??
        defaultPoseCanvas.background,
    },
    appearance,
    pose2d: options?.pose2d ? clonePose2D(options.pose2d) : createStandingPose2D(),
    pose3d: options?.pose3d ? clonePose3D(options.pose3d) : createStandingPose3D(),
    human2dModel: createDefaultHuman2DModelState({
      skinColor: appearance.skinColor,
      clothColor: appearance.clothColor,
      accentColor: appearance.accentColor,
      showJointHandles: appearance.showJointHandles,
      showSkeleton: appearance.showSkeleton,
      ...options?.human2dModel,
    }),
  };
}

export function updatePose2DJoint(
  pose: Pose2D,
  joint: Joint2D,
  point: Point2D,
): Pose2D {
  return {
    ...clonePose2D(pose),
    [joint]: {
      x: Number(point.x.toFixed(2)),
      y: Number(point.y.toFixed(2)),
    },
  };
}

export function updatePose3DJointRotation(
  pose: Pose3D,
  joint: Joint3D,
  rotation: EulerRotation,
): Pose3D {
  return {
    ...clonePose3D(pose),
    [joint]: {
      x: Number(rotation.x.toFixed(4)),
      y: Number(rotation.y.toFixed(4)),
      z: Number(rotation.z.toFixed(4)),
    },
  };
}
