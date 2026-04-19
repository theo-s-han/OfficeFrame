import * as THREE from "three";
import { describe, expect, it } from "vitest";
import {
  applyPose3DToBindingMap,
  buildGenericHumanoidJointBindingMap,
  extractPose3DFromBinding,
  getMissingPoseJointBindings,
  hasUsablePoseJointBindings,
} from "./humanoidModel";
import { createStandingPose3D } from "./defaultPose";

function createBone(name: string) {
  const bone = new THREE.Bone();

  bone.name = name;

  return bone;
}

function createMixamoLikeRig() {
  const root = new THREE.Group();
  const hips = createBone("mixamorigHips");
  const spine = createBone("mixamorigSpine");
  const chest = createBone("mixamorigSpine2");
  const neck = createBone("mixamorigNeck");
  const leftUpperArm = createBone("mixamorigLeftArm");
  const leftLowerArm = createBone("mixamorigLeftForeArm");
  const rightUpperArm = createBone("mixamorigRightArm");
  const rightLowerArm = createBone("mixamorigRightForeArm");
  const leftUpperLeg = createBone("mixamorigLeftUpLeg");
  const leftLowerLeg = createBone("mixamorigLeftLeg");
  const rightUpperLeg = createBone("mixamorigRightUpLeg");
  const rightLowerLeg = createBone("mixamorigRightLeg");

  root.add(hips);
  hips.add(spine);
  spine.add(chest);
  chest.add(neck);
  chest.add(leftUpperArm, rightUpperArm);
  leftUpperArm.add(leftLowerArm);
  rightUpperArm.add(rightLowerArm);
  hips.add(leftUpperLeg, rightUpperLeg);
  leftUpperLeg.add(leftLowerLeg);
  rightUpperLeg.add(rightLowerLeg);
  root.updateMatrixWorld(true);

  return root;
}

describe("humanoidModel", () => {
  it("maps generic mixamo-like bones to the pose joints", () => {
    const bindings = buildGenericHumanoidJointBindingMap(createMixamoLikeRig());

    expect(hasUsablePoseJointBindings(bindings)).toBe(true);
    expect(getMissingPoseJointBindings(bindings)).toEqual([]);
    expect(bindings.leftShoulder?.object.name).toBe("mixamorigLeftArm");
    expect(bindings.rightElbow?.object.name).toBe("mixamorigRightForeArm");
    expect(bindings.leftKnee?.object.name).toBe("mixamorigLeftLeg");
  });

  it("applies pose rotations to bindings and extracts them back deterministically", () => {
    const bindings = buildGenericHumanoidJointBindingMap(createMixamoLikeRig());
    const pose3d = createStandingPose3D();

    pose3d.leftShoulder = { x: -0.8, y: 0.2, z: 0.5 };
    pose3d.rightHip = { x: 0.4, y: -0.1, z: -0.2 };

    applyPose3DToBindingMap(bindings, pose3d);

    const leftShoulderBinding = bindings.leftShoulder;
    const rightHipBinding = bindings.rightHip;

    expect(leftShoulderBinding).toBeTruthy();
    expect(rightHipBinding).toBeTruthy();

    if (!leftShoulderBinding || !rightHipBinding) {
      throw new Error("required bindings were not created");
    }

    expect(extractPose3DFromBinding("leftShoulder", leftShoulderBinding)).toEqual(
      pose3d.leftShoulder,
    );
    expect(extractPose3DFromBinding("rightHip", rightHipBinding)).toEqual(
      pose3d.rightHip,
    );
  });
});
