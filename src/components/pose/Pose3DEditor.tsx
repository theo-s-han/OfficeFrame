"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, TransformControls } from "@react-three/drei";
import type { TransformControls as TransformControlsImpl } from "three-stdlib";
import { getPoseHumanoidAssetCandidates } from "@/lib/pose/humanoidAssets";
import { logPoseDebug } from "@/lib/pose/debug";
import {
  applyPose3DToBindingMap,
  buildGenericHumanoidJointBindingMap,
  buildVrmJointBindingMap,
  clampPose3DJointRotation,
  disposeHumanoidRoot,
  extractPose3DFromBinding,
  getMissingPoseJointBindings,
  hasUsablePoseJointBindings,
  normalizeHumanoidRoot,
  type PoseJointBindingMap,
} from "@/lib/pose/humanoidModel";
import {
  loadFirstHumanoidModel,
  type LoadedHumanoidModel,
} from "@/lib/pose/loadHumanoidModel";
import type { CharacterPoseSpec, Joint3D } from "@/lib/pose/poseSpec";

type Pose3DEditorProps = {
  selectedJoint: Joint3D | null;
  spec: CharacterPoseSpec;
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
  onPoseChange: (pose: CharacterPoseSpec["pose3d"]) => void;
  onSelectJoint: (joint: Joint3D | null) => void;
};

type BodyScale3D = {
  headRadius: number;
  jointRadius: number;
  limbRadius: number;
  shoulderOffset: number;
  torsoDepth: number;
  torsoHeight: number;
  torsoWidth: number;
};

type Pose3DRendererStatus = {
  assetLabel?: string;
  message: string;
  source: "human-asset" | "primitive-fallback";
  state: "loading" | "ready" | "empty" | "error";
  title: string;
};

const torsoBottomOffset = 1.05;
const chestOffset = 1.05;
const neckOffset = 0.68;
const upperArmLength = 0.88;
const lowerArmLength = 0.82;
const upperLegLength = 1.02;
const lowerLegLength = 1.02;

function getBodyScale(
  bodyStyle: CharacterPoseSpec["appearance"]["bodyStyle"],
): BodyScale3D {
  if (bodyStyle === "slim") {
    return {
      headRadius: 0.33,
      jointRadius: 0.08,
      limbRadius: 0.1,
      shoulderOffset: 0.62,
      torsoDepth: 0.36,
      torsoHeight: 1.48,
      torsoWidth: 0.84,
    };
  }

  if (bodyStyle === "broad") {
    return {
      headRadius: 0.39,
      jointRadius: 0.11,
      limbRadius: 0.13,
      shoulderOffset: 0.78,
      torsoDepth: 0.5,
      torsoHeight: 1.64,
      torsoWidth: 1.08,
    };
  }

  return {
    headRadius: 0.36,
    jointRadius: 0.095,
    limbRadius: 0.115,
    shoulderOffset: 0.7,
    torsoDepth: 0.42,
    torsoHeight: 1.56,
    torsoWidth: 0.94,
  };
}

function PoseCanvasReporter({
  onCanvasReady,
}: {
  onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
}) {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    onCanvasReady(gl.domElement);

    return () => {
      onCanvasReady(null);
    };
  }, [gl, onCanvasReady]);

  return null;
}

function JointHandle({
  color,
  isSelected,
  joint,
  radius,
  visible,
  onSelect,
}: {
  color: string;
  isSelected: boolean;
  joint: Joint3D;
  radius: number;
  visible: boolean;
  onSelect: (joint: Joint3D) => void;
}) {
  return (
    <mesh
      visible={visible}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(joint);
      }}
    >
      <sphereGeometry args={[radius, 18, 18]} />
      <meshStandardMaterial
        color={isSelected ? color : "#FFFFFF"}
        emissive={isSelected ? color : "#FFFFFF"}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
  );
}

function LimbSegment({
  color,
  length,
  radius,
}: {
  color: string;
  length: number;
  radius: number;
}) {
  return (
    <mesh position={[0, -length / 2, 0]}>
      <cylinderGeometry args={[radius, radius, length, 14]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function SkeletonSegment({
  color,
  length,
  radius,
  visible,
}: {
  color: string;
  length: number;
  radius: number;
  visible: boolean;
}) {
  return (
    <mesh position={[0, -length / 2, 0]} visible={visible}>
      <cylinderGeometry args={[radius, radius, length, 10]} />
      <meshStandardMaterial color={color} opacity={0.28} transparent />
    </mesh>
  );
}

function PrimitivePoseRig({
  bodyScale,
  onRegisterJointRef,
  selectedJoint,
  spec,
  onSelectJoint,
}: {
  bodyScale: BodyScale3D;
  onRegisterJointRef: (joint: Joint3D, node: THREE.Group | null) => void;
  selectedJoint: Joint3D | null;
  spec: CharacterPoseSpec;
  onSelectJoint: (joint: Joint3D) => void;
}) {
  const handleVisible = spec.appearance.showJointHandles;
  const skeletonVisible = spec.appearance.showSkeleton;
  const jointRadius = bodyScale.jointRadius;
  const guideColor = spec.appearance.accentColor;
  const leftHipOffset = bodyScale.torsoWidth * 0.28;

  return (
    <group position={[0, 0.3, 0]}>
      <group
        ref={(node) => {
          onRegisterJointRef("pelvis", node);
        }}
        rotation={[
          spec.pose3d.pelvis.x,
          spec.pose3d.pelvis.y,
          spec.pose3d.pelvis.z,
        ]}
      >
        <JointHandle
          color={spec.appearance.accentColor}
          isSelected={selectedJoint === "pelvis"}
          joint="pelvis"
          radius={jointRadius}
          visible={handleVisible}
          onSelect={onSelectJoint}
        />
        <mesh position={[0, torsoBottomOffset * 0.5, 0]}>
          <boxGeometry
            args={[
              bodyScale.torsoWidth,
              bodyScale.torsoHeight,
              bodyScale.torsoDepth,
            ]}
          />
          <meshStandardMaterial color={spec.appearance.clothColor} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <boxGeometry
            args={[bodyScale.torsoWidth * 0.72, 0.18, bodyScale.torsoDepth * 0.9]}
          />
          <meshStandardMaterial color={spec.appearance.clothColor} />
        </mesh>

        <group
          position={[0, chestOffset, 0]}
          ref={(node) => {
            onRegisterJointRef("chest", node);
          }}
          rotation={[
            spec.pose3d.chest.x,
            spec.pose3d.chest.y,
            spec.pose3d.chest.z,
          ]}
        >
          <JointHandle
            color={spec.appearance.accentColor}
            isSelected={selectedJoint === "chest"}
            joint="chest"
            radius={jointRadius}
            visible={handleVisible}
            onSelect={onSelectJoint}
          />
          <group
            position={[0, neckOffset, 0]}
            ref={(node) => {
              onRegisterJointRef("neck", node);
            }}
            rotation={[
              spec.pose3d.neck.x,
              spec.pose3d.neck.y,
              spec.pose3d.neck.z,
            ]}
          >
            <JointHandle
              color={spec.appearance.accentColor}
              isSelected={selectedJoint === "neck"}
              joint="neck"
              radius={jointRadius}
              visible={handleVisible}
              onSelect={onSelectJoint}
            />
            <mesh position={[0, bodyScale.headRadius * 1.3, 0]}>
              <sphereGeometry args={[bodyScale.headRadius, 24, 24]} />
              <meshStandardMaterial color={spec.appearance.skinColor} />
            </mesh>
            <SkeletonSegment
              color={guideColor}
              length={bodyScale.headRadius * 2.2}
              radius={bodyScale.limbRadius * 0.36}
              visible={skeletonVisible}
            />
          </group>

          <group
            position={[-bodyScale.shoulderOffset, 0.2, 0]}
            ref={(node) => {
              onRegisterJointRef("leftShoulder", node);
            }}
            rotation={[
              spec.pose3d.leftShoulder.x,
              spec.pose3d.leftShoulder.y,
              spec.pose3d.leftShoulder.z,
            ]}
          >
            <JointHandle
              color={spec.appearance.accentColor}
              isSelected={selectedJoint === "leftShoulder"}
              joint="leftShoulder"
              radius={jointRadius}
              visible={handleVisible}
              onSelect={onSelectJoint}
            />
            <LimbSegment
              color={spec.appearance.skinColor}
              length={upperArmLength}
              radius={bodyScale.limbRadius}
            />
            <SkeletonSegment
              color={guideColor}
              length={upperArmLength}
              radius={bodyScale.limbRadius * 0.34}
              visible={skeletonVisible}
            />
            <group
              position={[0, -upperArmLength, 0]}
              ref={(node) => {
                onRegisterJointRef("leftElbow", node);
              }}
              rotation={[
                spec.pose3d.leftElbow.x,
                spec.pose3d.leftElbow.y,
                spec.pose3d.leftElbow.z,
              ]}
            >
              <JointHandle
                color={spec.appearance.accentColor}
                isSelected={selectedJoint === "leftElbow"}
                joint="leftElbow"
                radius={jointRadius}
                visible={handleVisible}
                onSelect={onSelectJoint}
              />
              <LimbSegment
                color={spec.appearance.skinColor}
                length={lowerArmLength}
                radius={bodyScale.limbRadius * 0.94}
              />
              <SkeletonSegment
                color={guideColor}
                length={lowerArmLength}
                radius={bodyScale.limbRadius * 0.3}
                visible={skeletonVisible}
              />
              <mesh position={[0, -lowerArmLength - 0.08, 0]}>
                <sphereGeometry args={[jointRadius * 0.72, 14, 14]} />
                <meshStandardMaterial color={spec.appearance.skinColor} />
              </mesh>
            </group>
          </group>

          <group
            position={[bodyScale.shoulderOffset, 0.2, 0]}
            ref={(node) => {
              onRegisterJointRef("rightShoulder", node);
            }}
            rotation={[
              spec.pose3d.rightShoulder.x,
              spec.pose3d.rightShoulder.y,
              spec.pose3d.rightShoulder.z,
            ]}
          >
            <JointHandle
              color={spec.appearance.accentColor}
              isSelected={selectedJoint === "rightShoulder"}
              joint="rightShoulder"
              radius={jointRadius}
              visible={handleVisible}
              onSelect={onSelectJoint}
            />
            <LimbSegment
              color={spec.appearance.skinColor}
              length={upperArmLength}
              radius={bodyScale.limbRadius}
            />
            <SkeletonSegment
              color={guideColor}
              length={upperArmLength}
              radius={bodyScale.limbRadius * 0.34}
              visible={skeletonVisible}
            />
            <group
              position={[0, -upperArmLength, 0]}
              ref={(node) => {
                onRegisterJointRef("rightElbow", node);
              }}
              rotation={[
                spec.pose3d.rightElbow.x,
                spec.pose3d.rightElbow.y,
                spec.pose3d.rightElbow.z,
              ]}
            >
              <JointHandle
                color={spec.appearance.accentColor}
                isSelected={selectedJoint === "rightElbow"}
                joint="rightElbow"
                radius={jointRadius}
                visible={handleVisible}
                onSelect={onSelectJoint}
              />
              <LimbSegment
                color={spec.appearance.skinColor}
                length={lowerArmLength}
                radius={bodyScale.limbRadius * 0.94}
              />
              <SkeletonSegment
                color={guideColor}
                length={lowerArmLength}
                radius={bodyScale.limbRadius * 0.3}
                visible={skeletonVisible}
              />
              <mesh position={[0, -lowerArmLength - 0.08, 0]}>
                <sphereGeometry args={[jointRadius * 0.72, 14, 14]} />
                <meshStandardMaterial color={spec.appearance.skinColor} />
              </mesh>
            </group>
          </group>
        </group>

        <group
          position={[-leftHipOffset, -0.08, 0]}
          ref={(node) => {
            onRegisterJointRef("leftHip", node);
          }}
          rotation={[
            spec.pose3d.leftHip.x,
            spec.pose3d.leftHip.y,
            spec.pose3d.leftHip.z,
          ]}
        >
          <JointHandle
            color={spec.appearance.accentColor}
            isSelected={selectedJoint === "leftHip"}
            joint="leftHip"
            radius={jointRadius}
            visible={handleVisible}
            onSelect={onSelectJoint}
          />
          <LimbSegment
            color={spec.appearance.skinColor}
            length={upperLegLength}
            radius={bodyScale.limbRadius * 1.02}
          />
          <SkeletonSegment
            color={guideColor}
            length={upperLegLength}
            radius={bodyScale.limbRadius * 0.34}
            visible={skeletonVisible}
          />
          <group
            position={[0, -upperLegLength, 0]}
            ref={(node) => {
              onRegisterJointRef("leftKnee", node);
            }}
            rotation={[
              spec.pose3d.leftKnee.x,
              spec.pose3d.leftKnee.y,
              spec.pose3d.leftKnee.z,
            ]}
          >
            <JointHandle
              color={spec.appearance.accentColor}
              isSelected={selectedJoint === "leftKnee"}
              joint="leftKnee"
              radius={jointRadius}
              visible={handleVisible}
              onSelect={onSelectJoint}
            />
            <LimbSegment
              color={spec.appearance.skinColor}
              length={lowerLegLength}
              radius={bodyScale.limbRadius * 0.96}
            />
            <SkeletonSegment
              color={guideColor}
              length={lowerLegLength}
              radius={bodyScale.limbRadius * 0.3}
              visible={skeletonVisible}
            />
            <mesh position={[0, -lowerLegLength - 0.08, 0.08]}>
              <boxGeometry args={[0.28, 0.12, 0.58]} />
              <meshStandardMaterial color={spec.appearance.skinColor} />
            </mesh>
          </group>
        </group>

        <group
          position={[leftHipOffset, -0.08, 0]}
          ref={(node) => {
            onRegisterJointRef("rightHip", node);
          }}
          rotation={[
            spec.pose3d.rightHip.x,
            spec.pose3d.rightHip.y,
            spec.pose3d.rightHip.z,
          ]}
        >
          <JointHandle
            color={spec.appearance.accentColor}
            isSelected={selectedJoint === "rightHip"}
            joint="rightHip"
            radius={jointRadius}
            visible={handleVisible}
            onSelect={onSelectJoint}
          />
          <LimbSegment
            color={spec.appearance.skinColor}
            length={upperLegLength}
            radius={bodyScale.limbRadius * 1.02}
          />
          <SkeletonSegment
            color={guideColor}
            length={upperLegLength}
            radius={bodyScale.limbRadius * 0.34}
            visible={skeletonVisible}
          />
          <group
            position={[0, -upperLegLength, 0]}
            ref={(node) => {
              onRegisterJointRef("rightKnee", node);
            }}
            rotation={[
              spec.pose3d.rightKnee.x,
              spec.pose3d.rightKnee.y,
              spec.pose3d.rightKnee.z,
            ]}
          >
            <JointHandle
              color={spec.appearance.accentColor}
              isSelected={selectedJoint === "rightKnee"}
              joint="rightKnee"
              radius={jointRadius}
              visible={handleVisible}
              onSelect={onSelectJoint}
            />
            <LimbSegment
              color={spec.appearance.skinColor}
              length={lowerLegLength}
              radius={bodyScale.limbRadius * 0.96}
            />
            <SkeletonSegment
              color={guideColor}
              length={lowerLegLength}
              radius={bodyScale.limbRadius * 0.3}
              visible={skeletonVisible}
            />
            <mesh position={[0, -lowerLegLength - 0.08, 0.08]}>
              <boxGeometry args={[0.28, 0.12, 0.58]} />
              <meshStandardMaterial color={spec.appearance.skinColor} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

function HumanoidJointMarker({
  binding,
  color,
  isSelected,
  visible,
  onSelect,
}: {
  binding: NonNullable<PoseJointBindingMap[Joint3D]>;
  color: string;
  isSelected: boolean;
  visible: boolean;
  onSelect: (joint: Joint3D) => void;
}) {
  const markerRef = useRef<THREE.Mesh | null>(null);
  const worldPosition = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!markerRef.current) {
      return;
    }

    binding.object.getWorldPosition(worldPosition);
    markerRef.current.position.copy(worldPosition);
  });

  return (
    <mesh
      ref={markerRef}
      visible={visible}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect(binding.joint);
      }}
    >
      <sphereGeometry args={[isSelected ? 0.11 : 0.095, 18, 18]} />
      <meshStandardMaterial
        color={isSelected ? color : "#FFFFFF"}
        emissive={isSelected ? color : "#FFFFFF"}
        emissiveIntensity={isSelected ? 0.35 : 0}
      />
    </mesh>
  );
}

function HumanoidSkeletonGuide({
  color,
  root,
  visible,
}: {
  color: string;
  root: THREE.Object3D;
  visible: boolean;
}) {
  const helper = useMemo(() => {
    const nextHelper = new THREE.SkeletonHelper(root);
    const material = nextHelper.material as THREE.LineBasicMaterial;

    material.color = new THREE.Color(color);
    material.transparent = true;
    material.opacity = 0.45;

    return nextHelper;
  }, [color, root]);

  useEffect(
    () => () => {
      helper.geometry.dispose();

      const material = helper.material as THREE.Material | THREE.Material[];

      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose());
      } else {
        material.dispose();
      }
    },
    [helper],
  );

  return <primitive object={helper} visible={visible} />;
}

function Pose3DScene({
  selectedJoint,
  spec,
  onCanvasReady,
  onPoseChange,
  onRendererStatusChange,
  onSelectJoint,
}: Pose3DEditorProps & {
  onRendererStatusChange: (status: Pose3DRendererStatus) => void;
}) {
  const [isTransforming, setIsTransforming] = useState(false);
  const [humanModel, setHumanModel] = useState<LoadedHumanoidModel | null>(null);
  const [humanBindings, setHumanBindings] = useState<PoseJointBindingMap>({});
  const bodyScale = useMemo(
    () => getBodyScale(spec.appearance.bodyStyle),
    [spec.appearance.bodyStyle],
  );
  const primitiveJointRefs = useRef<Record<Joint3D, THREE.Group | null>>({
    neck: null,
    chest: null,
    pelvis: null,
    leftShoulder: null,
    leftElbow: null,
    rightShoulder: null,
    rightElbow: null,
    leftHip: null,
    leftKnee: null,
    rightHip: null,
    rightKnee: null,
  });
  const transformControlsRef = useRef<TransformControlsImpl | null>(null);
  const sceneBackground =
    spec.canvas.background === "transparent"
      ? null
      : spec.canvas.background === "grid"
        ? "#FBFCFD"
        : "#FFFFFF";
  const isHumanRendererReady = Boolean(humanModel);

  const attachTransformTarget = useCallback((object: THREE.Object3D | null) => {
    if (!transformControlsRef.current) {
      return;
    }

    if (object) {
      transformControlsRef.current.attach(object);
      return;
    }

    transformControlsRef.current.detach();
  }, []);

  const registerPrimitiveJointRef = useCallback(
    (joint: Joint3D, node: THREE.Group | null) => {
      primitiveJointRefs.current[joint] = node;

      if (!isHumanRendererReady && selectedJoint === joint) {
        attachTransformTarget(node);
      }
    },
    [attachTransformTarget, isHumanRendererReady, selectedJoint],
  );

  useEffect(() => {
    let isDisposed = false;
    let nextLoadedModel: LoadedHumanoidModel | null = null;

    onRendererStatusChange({
      message: "로컬 사람형 asset을 확인하는 중입니다.",
      source: "human-asset",
      state: "loading",
      title: "3D 사람형 모델",
    });

    void (async () => {
      const loadResult = await loadFirstHumanoidModel(
        getPoseHumanoidAssetCandidates(),
      );
      const model = loadResult.model;

      if (isDisposed) {
        if (model) {
          disposeHumanoidRoot(model.root);
        }

        return;
      }

      if (!model) {
        onRendererStatusChange({
          message:
            "public/assets/pose/models/human/ 아래에 VRM/GLB asset을 넣으면 사람형 3D 캐릭터로 전환됩니다. 지금은 primitive fallback을 표시합니다.",
          source: "primitive-fallback",
          state: "empty",
          title: "사람형 asset 없음",
        });
        return;
      }

      normalizeHumanoidRoot(model.root);

      const bindings = model.vrm
        ? buildVrmJointBindingMap(model.vrm)
        : buildGenericHumanoidJointBindingMap(model.root);

      if (!hasUsablePoseJointBindings(bindings)) {
        const missingJoints = getMissingPoseJointBindings(bindings);

        logPoseDebug("humanoid-binding-missing", {
          assetLabel: model.candidate.label,
          missingJoints,
        });
        disposeHumanoidRoot(model.root);
        onRendererStatusChange({
          assetLabel: model.candidate.label,
          message: `필수 humanoid bone을 찾지 못했습니다 (${missingJoints.join(", ")}). primitive fallback을 표시합니다.`,
          source: "primitive-fallback",
          state: "error",
          title: "사람형 bone 매핑 실패",
        });
        return;
      }

      nextLoadedModel = model;
      setHumanBindings(bindings);
      setHumanModel(model);
      onRendererStatusChange({
        assetLabel: model.candidate.label,
        message: "로컬 사람형 3D asset을 사용 중입니다.",
        source: "human-asset",
        state: "ready",
        title: "사람형 3D 모델",
      });
    })();

    return () => {
      isDisposed = true;

      if (nextLoadedModel) {
        disposeHumanoidRoot(nextLoadedModel.root);
      }
    };
  }, [onRendererStatusChange]);

  useEffect(() => {
    if (!humanModel) {
      return;
    }

    applyPose3DToBindingMap(humanBindings, spec.pose3d);
  }, [humanBindings, humanModel, spec.pose3d]);

  useEffect(() => {
    if (humanModel?.vrm) {
      humanModel.vrm.humanoid.update();
    }
  }, [humanModel, spec.pose3d]);

  useEffect(() => {
    if (humanModel && selectedJoint) {
      attachTransformTarget(humanBindings[selectedJoint]?.object ?? null);
      return;
    }

    if (!humanModel && selectedJoint) {
      attachTransformTarget(primitiveJointRefs.current[selectedJoint] ?? null);
      return;
    }

    attachTransformTarget(null);
  }, [attachTransformTarget, humanBindings, humanModel, selectedJoint]);

  useFrame((_, delta) => {
    humanModel?.vrm?.update(delta);
  });

  return (
    <>
      {sceneBackground ? <color attach="background" args={[sceneBackground]} /> : null}
      <ambientLight intensity={0.8} />
      <directionalLight intensity={1.1} position={[3, 4, 5]} />
      <directionalLight intensity={0.45} position={[-4, 3, 2]} />
      {spec.canvas.background === "grid" ? (
        <gridHelper
          args={[10, 10, "#D0D7E2", "#E7EBF2"]}
          position={[0, -1.92, 0]}
        />
      ) : null}

      {humanModel ? (
        <>
          <primitive object={humanModel.root} />
          <HumanoidSkeletonGuide
            color={spec.appearance.accentColor}
            root={humanModel.root}
            visible={spec.appearance.showSkeleton}
          />
          {(Object.values(humanBindings) as Array<
            NonNullable<PoseJointBindingMap[Joint3D]>
          >).map((binding) => (
            <HumanoidJointMarker
              binding={binding}
              color={spec.appearance.accentColor}
              isSelected={selectedJoint === binding.joint}
              key={binding.joint}
              visible={spec.appearance.showJointHandles}
              onSelect={onSelectJoint}
            />
          ))}
        </>
      ) : (
        <PrimitivePoseRig
          bodyScale={bodyScale}
          onRegisterJointRef={registerPrimitiveJointRef}
          selectedJoint={selectedJoint}
          spec={spec}
          onSelectJoint={onSelectJoint}
        />
      )}

      <OrbitControls enabled={!isTransforming} makeDefault />
      {selectedJoint ? (
        <TransformControls
          ref={transformControlsRef}
          mode="rotate"
          size={0.75}
          onMouseDown={() => setIsTransforming(true)}
          onMouseUp={() => setIsTransforming(false)}
          onObjectChange={() => {
            if (!selectedJoint) {
              return;
            }

            if (humanModel) {
              const binding = humanBindings[selectedJoint];

              if (!binding) {
                return;
              }

              const nextRotation = extractPose3DFromBinding(selectedJoint, binding);

              applyPose3DToBindingMap(
                {
                  [selectedJoint]: {
                    ...binding,
                  },
                },
                {
                  ...spec.pose3d,
                  [selectedJoint]: nextRotation,
                },
              );
              onPoseChange({
                ...spec.pose3d,
                [selectedJoint]: nextRotation,
              });
              return;
            }

            const primitiveObject = primitiveJointRefs.current[selectedJoint];

            if (!primitiveObject) {
              return;
            }

            const nextRotation = clampPose3DJointRotation(selectedJoint, {
              x: primitiveObject.rotation.x,
              y: primitiveObject.rotation.y,
              z: primitiveObject.rotation.z,
            });

            primitiveObject.rotation.set(
              nextRotation.x,
              nextRotation.y,
              nextRotation.z,
            );
            onPoseChange({
              ...spec.pose3d,
              [selectedJoint]: nextRotation,
            });
          }}
        />
      ) : null}
      <PoseCanvasReporter onCanvasReady={onCanvasReady} />
    </>
  );
}

export function Pose3DEditor({
  selectedJoint,
  spec,
  onCanvasReady,
  onPoseChange,
  onSelectJoint,
}: Pose3DEditorProps) {
  const [rendererStatus, setRendererStatus] = useState<Pose3DRendererStatus>({
    message: "로컬 사람형 asset을 확인하는 중입니다.",
    source: "human-asset",
    state: "loading",
    title: "3D 사람형 모델",
  });

  return (
    <div className="pose-canvas-scroll">
      <div className="pose-3d-surface">
        <div
          className="pose-3d-canvas-shell"
          style={{
            width: spec.canvas.width,
            height: spec.canvas.height,
            background:
              spec.canvas.background === "transparent"
                ? "transparent"
                : spec.canvas.background === "grid"
                  ? "#FBFCFD"
                  : "#FFFFFF",
          }}
        >
          <Canvas
            camera={{ position: [0, 1.8, 5.4], fov: 38 }}
            gl={{
              alpha: spec.canvas.background === "transparent",
              antialias: true,
              preserveDrawingBuffer: true,
            }}
            onPointerMissed={() => onSelectJoint(null)}
          >
            <Suspense fallback={null}>
              <Pose3DScene
                selectedJoint={selectedJoint}
                spec={spec}
                onCanvasReady={onCanvasReady}
                onPoseChange={onPoseChange}
                onRendererStatusChange={setRendererStatus}
                onSelectJoint={onSelectJoint}
              />
            </Suspense>
          </Canvas>
        </div>

        <div
          className={`pose-3d-renderer-status pose-3d-renderer-status-${rendererStatus.source}`}
          role={rendererStatus.state === "error" ? "alert" : undefined}
        >
          <strong>{rendererStatus.title}</strong>
          <span>
            {rendererStatus.assetLabel ? `${rendererStatus.assetLabel} · ` : ""}
            {rendererStatus.message}
          </span>
        </div>
      </div>
    </div>
  );
}
