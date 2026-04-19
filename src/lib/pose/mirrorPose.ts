import { clonePose2D, clonePose3D } from "./defaultPose";
import type {
  CharacterPoseSpec,
  EulerRotation,
  Joint2D,
  Joint3D,
  Pose2D,
  Pose3D,
} from "./poseSpec";

const mirrored2dPairs: Array<[Joint2D, Joint2D]> = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftWrist", "rightWrist"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
  ["leftAnkle", "rightAnkle"],
];

const centered2dJoints: Joint2D[] = ["head", "neck", "chest", "pelvis"];

const mirrored3dPairs: Array<[Joint3D, Joint3D]> = [
  ["leftShoulder", "rightShoulder"],
  ["leftElbow", "rightElbow"],
  ["leftHip", "rightHip"],
  ["leftKnee", "rightKnee"],
];

const centered3dJoints: Joint3D[] = ["neck", "chest", "pelvis"];

function mirrorRotation(rotation: EulerRotation): EulerRotation {
  return {
    x: rotation.x,
    y: -rotation.y,
    z: -rotation.z,
  };
}

function getMirroredPreset(preset: CharacterPoseSpec["preset"]): CharacterPoseSpec["preset"] {
  if (preset === "pointing-left") {
    return "pointing-right";
  }

  if (preset === "pointing-right") {
    return "pointing-left";
  }

  return preset;
}

export function mirrorPose2D(pose: Pose2D, width: number): Pose2D {
  const nextPose = clonePose2D(pose);

  centered2dJoints.forEach((joint) => {
    nextPose[joint] = {
      x: width - pose[joint].x,
      y: pose[joint].y,
    };
  });

  mirrored2dPairs.forEach(([leftJoint, rightJoint]) => {
    nextPose[leftJoint] = {
      x: width - pose[rightJoint].x,
      y: pose[rightJoint].y,
    };
    nextPose[rightJoint] = {
      x: width - pose[leftJoint].x,
      y: pose[leftJoint].y,
    };
  });

  return nextPose;
}

export function mirrorPose3D(pose: Pose3D): Pose3D {
  const nextPose = clonePose3D(pose);

  centered3dJoints.forEach((joint) => {
    nextPose[joint] = mirrorRotation(pose[joint]);
  });

  mirrored3dPairs.forEach(([leftJoint, rightJoint]) => {
    nextPose[leftJoint] = mirrorRotation(pose[rightJoint]);
    nextPose[rightJoint] = mirrorRotation(pose[leftJoint]);
  });

  return nextPose;
}

export function mirrorCharacterPoseSpec(
  spec: CharacterPoseSpec,
): CharacterPoseSpec {
  return {
    ...spec,
    preset: getMirroredPreset(spec.preset),
    pose2d: mirrorPose2D(spec.pose2d, spec.canvas.width),
    pose3d: mirrorPose3D(spec.pose3d),
  };
}
