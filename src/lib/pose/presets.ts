import {
  clonePose2D,
  clonePose3D,
  createCharacterPoseSpec,
  createStandingPose2D,
  createStandingPose3D,
} from "./defaultPose";
import { solveTwoBoneIK } from "./ik2d";
import type {
  CharacterPoseSpec,
  EulerRotation,
  Point2D,
  Pose2D,
  Pose3D,
  PoseMode,
  PosePreset,
} from "./poseSpec";

function applyArmTarget(
  pose: Pose2D,
  side: "left" | "right",
  target: Point2D,
  bendDirection: 1 | -1,
) {
  const shoulderKey = `${side}Shoulder` as const;
  const elbowKey = `${side}Elbow` as const;
  const wristKey = `${side}Wrist` as const;
  const upperLength = Math.hypot(
    pose[elbowKey].x - pose[shoulderKey].x,
    pose[elbowKey].y - pose[shoulderKey].y,
  );
  const lowerLength = Math.hypot(
    pose[wristKey].x - pose[elbowKey].x,
    pose[wristKey].y - pose[elbowKey].y,
  );
  const result = solveTwoBoneIK(
    pose[shoulderKey],
    target,
    upperLength,
    lowerLength,
    bendDirection,
  );

  pose[elbowKey] = result.mid;
  pose[wristKey] = result.end;
}

function applyLegTarget(
  pose: Pose2D,
  side: "left" | "right",
  target: Point2D,
  bendDirection: 1 | -1,
) {
  const hipKey = `${side}Hip` as const;
  const kneeKey = `${side}Knee` as const;
  const ankleKey = `${side}Ankle` as const;
  const upperLength = Math.hypot(
    pose[kneeKey].x - pose[hipKey].x,
    pose[kneeKey].y - pose[hipKey].y,
  );
  const lowerLength = Math.hypot(
    pose[ankleKey].x - pose[kneeKey].x,
    pose[ankleKey].y - pose[kneeKey].y,
  );
  const result = solveTwoBoneIK(
    pose[hipKey],
    target,
    upperLength,
    lowerLength,
    bendDirection,
  );

  pose[kneeKey] = result.mid;
  pose[ankleKey] = result.end;
}

function createPose2DForPreset(preset: PosePreset): Pose2D {
  const pose = clonePose2D(createStandingPose2D());

  switch (preset) {
    case "arms-up":
      applyArmTarget(pose, "left", { x: 392, y: 86 }, -1);
      applyArmTarget(pose, "right", { x: 508, y: 86 }, 1);
      break;
    case "pointing-right":
      applyArmTarget(pose, "right", { x: 690, y: 238 }, -1);
      applyArmTarget(pose, "left", { x: 338, y: 366 }, -1);
      break;
    case "pointing-left":
      applyArmTarget(pose, "left", { x: 210, y: 238 }, 1);
      applyArmTarget(pose, "right", { x: 562, y: 366 }, 1);
      break;
    case "presenting":
      applyArmTarget(pose, "left", { x: 304, y: 286 }, 1);
      applyArmTarget(pose, "right", { x: 642, y: 286 }, -1);
      break;
    case "walking":
      applyArmTarget(pose, "left", { x: 336, y: 414 }, -1);
      applyArmTarget(pose, "right", { x: 610, y: 324 }, 1);
      applyLegTarget(pose, "left", { x: 360, y: 612 }, 1);
      applyLegTarget(pose, "right", { x: 558, y: 560 }, -1);
      break;
    case "sitting-lite":
      applyArmTarget(pose, "left", { x: 350, y: 348 }, -1);
      applyArmTarget(pose, "right", { x: 550, y: 348 }, 1);
      applyLegTarget(pose, "left", { x: 334, y: 488 }, 1);
      applyLegTarget(pose, "right", { x: 566, y: 488 }, -1);
      pose.leftKnee.y += 34;
      pose.rightKnee.y += 34;
      break;
    case "standing":
    default:
      break;
  }

  return pose;
}

function createRotation(x = 0, y = 0, z = 0): EulerRotation {
  return { x, y, z };
}

function createPose3DForPreset(preset: PosePreset): Pose3D {
  const pose = clonePose3D(createStandingPose3D());

  switch (preset) {
    case "arms-up":
      pose.leftShoulder = createRotation(-1.45, 0, 0.24);
      pose.leftElbow = createRotation(0.42, 0, 0);
      pose.rightShoulder = createRotation(-1.45, 0, -0.24);
      pose.rightElbow = createRotation(0.42, 0, 0);
      break;
    case "pointing-right":
      pose.rightShoulder = createRotation(0, 0, -1.46);
      pose.rightElbow = createRotation(0.18, 0, 0);
      pose.leftShoulder = createRotation(0.18, 0.12, 0.3);
      pose.leftElbow = createRotation(0.42, 0, 0);
      break;
    case "pointing-left":
      pose.leftShoulder = createRotation(0, 0, 1.46);
      pose.leftElbow = createRotation(0.18, 0, 0);
      pose.rightShoulder = createRotation(0.18, -0.12, -0.3);
      pose.rightElbow = createRotation(0.42, 0, 0);
      break;
    case "presenting":
      pose.leftShoulder = createRotation(0.2, 0.18, 0.7);
      pose.leftElbow = createRotation(0.6, 0, 0);
      pose.rightShoulder = createRotation(0.18, -0.16, -0.92);
      pose.rightElbow = createRotation(0.48, 0, 0);
      pose.chest = createRotation(0, 0.12, 0);
      break;
    case "walking":
      pose.leftShoulder = createRotation(0.56, 0, 0.28);
      pose.rightShoulder = createRotation(-0.36, 0, -0.24);
      pose.leftHip = createRotation(-0.4, 0, 0.12);
      pose.rightHip = createRotation(0.5, 0, -0.12);
      pose.leftKnee = createRotation(0.26, 0, 0);
      pose.rightKnee = createRotation(0.68, 0, 0);
      pose.pelvis = createRotation(0.05, 0.08, 0);
      break;
    case "sitting-lite":
      pose.leftHip = createRotation(1.12, 0, 0.04);
      pose.rightHip = createRotation(1.12, 0, -0.04);
      pose.leftKnee = createRotation(1.02, 0, 0);
      pose.rightKnee = createRotation(1.02, 0, 0);
      pose.leftShoulder = createRotation(0.16, 0, 0.1);
      pose.rightShoulder = createRotation(0.16, 0, -0.1);
      pose.chest = createRotation(-0.08, 0, 0);
      break;
    case "standing":
    default:
      break;
  }

  return pose;
}

export function createPoseSpecFromPreset(
  preset: PosePreset,
  options?: {
    mode?: PoseMode;
    overrides?: Partial<
      Pick<CharacterPoseSpec, "appearance" | "canvas" | "human2dModel">
    >;
  },
): CharacterPoseSpec {
  return createCharacterPoseSpec(preset, {
    mode: options?.mode ?? "2d",
    appearance: options?.overrides?.appearance,
    canvas: options?.overrides?.canvas,
    human2dModel: options?.overrides?.human2dModel,
    pose2d: createPose2DForPreset(preset),
    pose3d: createPose3DForPreset(preset),
  });
}
