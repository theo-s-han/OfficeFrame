import * as THREE from "three";
import type { VRM, VRMHumanBoneName } from "@pixiv/three-vrm";
import type { Joint3D, Pose3D, EulerRotation } from "./poseSpec";

export type PoseJointBinding = {
  joint: Joint3D;
  object: THREE.Object3D;
  restQuaternion: THREE.Quaternion;
};

export type PoseJointBindingMap = Partial<Record<Joint3D, PoseJointBinding>>;

const poseJointRanges: Record<
  Joint3D,
  { x: [number, number]; y: [number, number]; z: [number, number] }
> = {
  neck: { x: [-0.7, 0.7], y: [-0.9, 0.9], z: [-0.6, 0.6] },
  chest: { x: [-0.8, 0.8], y: [-0.9, 0.9], z: [-0.8, 0.8] },
  pelvis: { x: [-0.8, 0.8], y: [-0.9, 0.9], z: [-0.8, 0.8] },
  leftShoulder: { x: [-2.2, 1.4], y: [-1.4, 1.4], z: [-2.1, 2.1] },
  leftElbow: { x: [0, 2.4], y: [-0.3, 0.3], z: [-0.4, 0.4] },
  rightShoulder: { x: [-2.2, 1.4], y: [-1.4, 1.4], z: [-2.1, 2.1] },
  rightElbow: { x: [0, 2.4], y: [-0.3, 0.3], z: [-0.4, 0.4] },
  leftHip: { x: [-1.5, 1.8], y: [-0.8, 0.8], z: [-0.8, 0.8] },
  leftKnee: { x: [0, 2.4], y: [-0.1, 0.1], z: [-0.1, 0.1] },
  rightHip: { x: [-1.5, 1.8], y: [-0.8, 0.8], z: [-0.8, 0.8] },
  rightKnee: { x: [0, 2.4], y: [-0.1, 0.1], z: [-0.1, 0.1] },
};

const poseJointToVrmBoneName: Record<Joint3D, VRMHumanBoneName> = {
  neck: "neck",
  chest: "chest",
  pelvis: "hips",
  leftShoulder: "leftUpperArm",
  leftElbow: "leftLowerArm",
  rightShoulder: "rightUpperArm",
  rightElbow: "rightLowerArm",
  leftHip: "leftUpperLeg",
  leftKnee: "leftLowerLeg",
  rightHip: "rightUpperLeg",
  rightKnee: "rightLowerLeg",
};

const genericHumanoidBoneNameCandidates: Record<Joint3D, string[]> = {
  neck: ["neck", "mixamorigneck"],
  chest: [
    "upperchest",
    "chest",
    "mixamorigspine2",
    "spine2",
    "spine_02",
    "spine.002",
    "mixamorigspine1",
    "spine1",
  ],
  pelvis: ["hips", "mixamorighips", "pelvis", "root", "mixamorigspine", "spine"],
  leftShoulder: [
    "leftupperarm",
    "mixamorigleftarm",
    "leftarm",
    "arm_l",
    "upperarm_l",
    "lupperarm",
    "leftshoulder",
  ],
  leftElbow: [
    "leftlowerarm",
    "mixamorigleftforearm",
    "leftforearm",
    "forearm_l",
    "lowerarm_l",
    "llowerarm",
  ],
  rightShoulder: [
    "rightupperarm",
    "mixamorigrightarm",
    "rightarm",
    "arm_r",
    "upperarm_r",
    "rupperarm",
    "rightshoulder",
  ],
  rightElbow: [
    "rightlowerarm",
    "mixamorigrightforearm",
    "rightforearm",
    "forearm_r",
    "lowerarm_r",
    "rlowerarm",
  ],
  leftHip: [
    "leftupperleg",
    "mixamorigleftupleg",
    "leftupleg",
    "leftthigh",
    "upleg_l",
    "thigh_l",
  ],
  leftKnee: [
    "leftlowerleg",
    "mixamorigleftleg",
    "leftleg",
    "leftshin",
    "lowerleg_l",
    "shin_l",
  ],
  rightHip: [
    "rightupperleg",
    "mixamorigrightupleg",
    "rightupleg",
    "rightthigh",
    "upleg_r",
    "thigh_r",
  ],
  rightKnee: [
    "rightlowerleg",
    "mixamorigrightleg",
    "rightleg",
    "rightshin",
    "lowerleg_r",
    "shin_r",
  ],
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeBoneName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function createBinding(joint: Joint3D, object: THREE.Object3D): PoseJointBinding {
  return {
    joint,
    object,
    restQuaternion: object.quaternion.clone(),
  };
}

function disposeMaterial(material: THREE.Material) {
  material.dispose();
}

export function clampPose3DJointRotation(
  joint: Joint3D,
  rotation: EulerRotation,
): EulerRotation {
  const range = poseJointRanges[joint];

  return {
    x: clamp(rotation.x, range.x[0], range.x[1]),
    y: clamp(rotation.y, range.y[0], range.y[1]),
    z: clamp(rotation.z, range.z[0], range.z[1]),
  };
}

export function applyPose3DToBindingMap(
  bindings: PoseJointBindingMap,
  pose3d: Pose3D,
) {
  (Object.keys(bindings) as Joint3D[]).forEach((joint) => {
    const binding = bindings[joint];

    if (!binding) {
      return;
    }

    const clampedRotation = clampPose3DJointRotation(joint, pose3d[joint]);
    const deltaQuaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(
        clampedRotation.x,
        clampedRotation.y,
        clampedRotation.z,
        "XYZ",
      ),
    );

    binding.object.quaternion.copy(binding.restQuaternion).multiply(deltaQuaternion);
  });
}

export function extractPose3DFromBinding(
  joint: Joint3D,
  binding: PoseJointBinding,
): EulerRotation {
  const deltaQuaternion = binding.restQuaternion
    .clone()
    .invert()
    .multiply(binding.object.quaternion.clone());
  const deltaEuler = new THREE.Euler().setFromQuaternion(deltaQuaternion, "XYZ");

  return clampPose3DJointRotation(joint, {
    x: Number(deltaEuler.x.toFixed(4)),
    y: Number(deltaEuler.y.toFixed(4)),
    z: Number(deltaEuler.z.toFixed(4)),
  });
}

export function buildVrmJointBindingMap(vrm: VRM): PoseJointBindingMap {
  const bindings: PoseJointBindingMap = {};

  (Object.entries(poseJointToVrmBoneName) as Array<[Joint3D, VRMHumanBoneName]>).forEach(
    ([joint, boneName]) => {
      const object = vrm.humanoid.getNormalizedBoneNode(boneName);

      if (object) {
        bindings[joint] = createBinding(joint, object);
      }
    },
  );

  return bindings;
}

export function buildGenericHumanoidJointBindingMap(
  root: THREE.Object3D,
): PoseJointBindingMap {
  const bonesByName = new Map<string, THREE.Bone>();

  root.traverse((object) => {
    if (object instanceof THREE.Bone) {
      bonesByName.set(normalizeBoneName(object.name), object);
    }
  });

  const bindings: PoseJointBindingMap = {};

  (Object.entries(genericHumanoidBoneNameCandidates) as Array<[Joint3D, string[]]>).forEach(
    ([joint, candidates]) => {
      const match = candidates
        .map((candidate) => bonesByName.get(normalizeBoneName(candidate)))
        .find(Boolean);

      if (match) {
        bindings[joint] = createBinding(joint, match);
      }
    },
  );

  return bindings;
}

export function getMissingPoseJointBindings(bindings: PoseJointBindingMap) {
  return (Object.keys(poseJointRanges) as Joint3D[]).filter(
    (joint) => !bindings[joint],
  );
}

export function hasUsablePoseJointBindings(bindings: PoseJointBindingMap) {
  return getMissingPoseJointBindings(bindings).length === 0;
}

export function normalizeHumanoidRoot(
  root: THREE.Object3D,
  options?: {
    floorY?: number;
    targetHeight?: number;
  },
) {
  const targetHeight = options?.targetHeight ?? 3.4;
  const floorY = options?.floorY ?? -1.92;
  const bounds = new THREE.Box3().setFromObject(root);

  if (bounds.isEmpty()) {
    return;
  }

  const size = bounds.getSize(new THREE.Vector3());

  if (size.y <= 0) {
    return;
  }

  const scale = targetHeight / size.y;

  root.scale.multiplyScalar(scale);
  root.updateMatrixWorld(true);

  const scaledBounds = new THREE.Box3().setFromObject(root);
  const scaledCenter = scaledBounds.getCenter(new THREE.Vector3());

  root.position.x -= scaledCenter.x;
  root.position.z -= scaledCenter.z;
  root.position.y += floorY - scaledBounds.min.y;
  root.updateMatrixWorld(true);
}

export function disposeHumanoidRoot(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;

    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMaterial);
    } else if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}
