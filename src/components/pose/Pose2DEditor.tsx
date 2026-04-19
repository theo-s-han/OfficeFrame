"use client";

import { useEffect, useMemo, useRef } from "react";
import Konva from "konva";
import { Circle, Layer, Line, Rect, Stage } from "react-konva";
import { normalizeHuman2DModelState } from "@/lib/pose/human2dAssets";
import {
  clonePose2D,
  updatePose2DJoint,
} from "@/lib/pose/defaultPose";
import {
  getPointDistance,
  projectMidpointToTwoBoneChain,
  solveTwoBoneIK,
} from "@/lib/pose/ik2d";
import type { Human2DCharacterAsset } from "@/lib/pose/human2dRigTypes";
import type {
  CharacterPoseSpec,
  Joint2D,
  Point2D,
} from "@/lib/pose/poseSpec";
import {
  pose2dJointKeys,
  poseDraggable2dJoints,
} from "@/lib/pose/poseSpec";
import type { PoseStageExportHandle } from "@/lib/pose/exportPosePng";
import { Human2DCharacterRenderer } from "./Human2DCharacterRenderer";

type Pose2DEditorProps = {
  human2dAssets: Human2DCharacterAsset[];
  selectedJoint: Joint2D | null;
  spec: CharacterPoseSpec;
  onPoseChange: (pose: CharacterPoseSpec["pose2d"]) => void;
  onSelectJoint: (joint: Joint2D) => void;
  onStageReady: (stage: PoseStageExportHandle | null) => void;
};

function getCurrentBendDirection(
  root: Point2D,
  mid: Point2D,
  end: Point2D,
  fallback: 1 | -1,
): 1 | -1 {
  const cross =
    (mid.x - root.x) * (end.y - root.y) - (mid.y - root.y) * (end.x - root.x);

  if (Math.abs(cross) <= 0.01) {
    return fallback;
  }

  return cross >= 0 ? 1 : -1;
}

function getPoseBodyScale(bodyStyle: CharacterPoseSpec["appearance"]["bodyStyle"]) {
  if (bodyStyle === "slim") {
    return {
      guideStrokeWidth: 2,
      handleRadius: 11,
    };
  }

  if (bodyStyle === "broad") {
    return {
      guideStrokeWidth: 3,
      handleRadius: 14,
    };
  }

  return {
    guideStrokeWidth: 2,
    handleRadius: 12,
  };
}

function createGridLines(width: number, height: number) {
  const lines: number[][] = [];
  const step = 40;

  for (let x = 0; x <= width; x += step) {
    lines.push([x, 0, x, height]);
  }

  for (let y = 0; y <= height; y += step) {
    lines.push([0, y, width, y]);
  }

  return lines;
}

function createHeadPoint(nextPoint: Point2D, pose: CharacterPoseSpec["pose2d"]) {
  const neck = pose.neck;
  const dx = nextPoint.x - neck.x;
  const dy = nextPoint.y - neck.y;
  const distance = Math.hypot(dx, dy);
  const clampedDistance = Math.min(96, Math.max(34, distance || 1));
  const ratio = clampedDistance / (distance || 1);

  return {
    x: Number((neck.x + dx * ratio).toFixed(2)),
    y: Number((neck.y + dy * ratio).toFixed(2)),
  };
}

export function Pose2DEditor({
  human2dAssets,
  selectedJoint,
  spec,
  onPoseChange,
  onSelectJoint,
  onStageReady,
}: Pose2DEditorProps) {
  const stageRef = useRef<Konva.Stage | null>(null);
  const bodyScale = useMemo(
    () => getPoseBodyScale(spec.appearance.bodyStyle),
    [spec.appearance.bodyStyle],
  );
  const human2dModel = useMemo(
    () =>
      normalizeHuman2DModelState(spec.human2dModel, {
        accentColor: spec.appearance.accentColor,
        clothColor: spec.appearance.clothColor,
        showJointHandles: spec.appearance.showJointHandles,
        showSkeleton: spec.appearance.showSkeleton,
        skinColor: spec.appearance.skinColor,
      }),
    [spec.appearance, spec.human2dModel],
  );
  const gridLines = useMemo(
    () => createGridLines(spec.canvas.width, spec.canvas.height),
    [spec.canvas.height, spec.canvas.width],
  );

  useEffect(() => {
    onStageReady(stageRef.current);

    return () => {
      onStageReady(null);
    };
  }, [onStageReady]);

  function updateArmByTarget(
    currentPose: CharacterPoseSpec["pose2d"],
    side: "left" | "right",
    target: Point2D,
  ) {
    const nextPose = clonePose2D(currentPose);
    const shoulderKey = `${side}Shoulder` as const;
    const elbowKey = `${side}Elbow` as const;
    const wristKey = `${side}Wrist` as const;
    const upperLength = getPointDistance(nextPose[shoulderKey], nextPose[elbowKey]);
    const lowerLength = getPointDistance(nextPose[elbowKey], nextPose[wristKey]);
    const bendDirection = getCurrentBendDirection(
      nextPose[shoulderKey],
      nextPose[elbowKey],
      nextPose[wristKey],
      side === "left" ? -1 : 1,
    );
    const result = solveTwoBoneIK(
      nextPose[shoulderKey],
      target,
      upperLength,
      lowerLength,
      bendDirection,
    );

    nextPose[elbowKey] = result.mid;
    nextPose[wristKey] = result.end;

    return nextPose;
  }

  function updateLegByTarget(
    currentPose: CharacterPoseSpec["pose2d"],
    side: "left" | "right",
    target: Point2D,
  ) {
    const nextPose = clonePose2D(currentPose);
    const hipKey = `${side}Hip` as const;
    const kneeKey = `${side}Knee` as const;
    const ankleKey = `${side}Ankle` as const;
    const upperLength = getPointDistance(nextPose[hipKey], nextPose[kneeKey]);
    const lowerLength = getPointDistance(nextPose[kneeKey], nextPose[ankleKey]);
    const bendDirection = getCurrentBendDirection(
      nextPose[hipKey],
      nextPose[kneeKey],
      nextPose[ankleKey],
      side === "left" ? 1 : -1,
    );
    const result = solveTwoBoneIK(
      nextPose[hipKey],
      target,
      upperLength,
      lowerLength,
      bendDirection,
    );

    nextPose[kneeKey] = result.mid;
    nextPose[ankleKey] = result.end;

    return nextPose;
  }

  function updateMidpoint(
    currentPose: CharacterPoseSpec["pose2d"],
    joint: Joint2D,
    target: Point2D,
  ) {
    const nextPose = clonePose2D(currentPose);

    if (joint === "leftElbow" || joint === "rightElbow") {
      const side = joint.startsWith("left") ? "left" : "right";
      const shoulderKey = `${side}Shoulder` as const;
      const wristKey = `${side}Wrist` as const;
      const upperLength = getPointDistance(nextPose[shoulderKey], nextPose[joint]);
      const lowerLength = getPointDistance(nextPose[joint], nextPose[wristKey]);
      const bendDirection = getCurrentBendDirection(
        nextPose[shoulderKey],
        nextPose[joint],
        nextPose[wristKey],
        side === "left" ? -1 : 1,
      );

      nextPose[joint] = projectMidpointToTwoBoneChain(
        nextPose[shoulderKey],
        nextPose[wristKey],
        target,
        upperLength,
        lowerLength,
        bendDirection,
      );
    }

    if (joint === "leftKnee" || joint === "rightKnee") {
      const side = joint.startsWith("left") ? "left" : "right";
      const hipKey = `${side}Hip` as const;
      const ankleKey = `${side}Ankle` as const;
      const upperLength = getPointDistance(nextPose[hipKey], nextPose[joint]);
      const lowerLength = getPointDistance(nextPose[joint], nextPose[ankleKey]);
      const bendDirection = getCurrentBendDirection(
        nextPose[hipKey],
        nextPose[joint],
        nextPose[ankleKey],
        side === "left" ? 1 : -1,
      );

      nextPose[joint] = projectMidpointToTwoBoneChain(
        nextPose[hipKey],
        nextPose[ankleKey],
        target,
        upperLength,
        lowerLength,
        bendDirection,
      );
    }

    return nextPose;
  }

  function handleJointDragMove(joint: Joint2D, target: Point2D) {
    let nextPose = spec.pose2d;

    if (joint === "head") {
      nextPose = updatePose2DJoint(
        spec.pose2d,
        "head",
        createHeadPoint(target, spec.pose2d),
      );
    } else if (joint === "leftWrist" || joint === "rightWrist") {
      nextPose = updateArmByTarget(
        spec.pose2d,
        joint.startsWith("left") ? "left" : "right",
        target,
      );
    } else if (joint === "leftAnkle" || joint === "rightAnkle") {
      nextPose = updateLegByTarget(
        spec.pose2d,
        joint.startsWith("left") ? "left" : "right",
        target,
      );
    } else if (
      joint === "leftElbow" ||
      joint === "rightElbow" ||
      joint === "leftKnee" ||
      joint === "rightKnee"
    ) {
      nextPose = updateMidpoint(spec.pose2d, joint, target);
    }

    onPoseChange(nextPose);
    onSelectJoint(joint);
  }

  const armSegments: Array<[Joint2D, Joint2D]> = [
    ["leftShoulder", "leftElbow"],
    ["leftElbow", "leftWrist"],
    ["rightShoulder", "rightElbow"],
    ["rightElbow", "rightWrist"],
  ];
  const legSegments: Array<[Joint2D, Joint2D]> = [
    ["leftHip", "leftKnee"],
    ["leftKnee", "leftAnkle"],
    ["rightHip", "rightKnee"],
    ["rightKnee", "rightAnkle"],
  ];
  const guideSegments: Array<[Joint2D, Joint2D]> = [
    ["head", "neck"],
    ["neck", "chest"],
    ["chest", "pelvis"],
    ["leftShoulder", "rightShoulder"],
    ["leftHip", "rightHip"],
    ...armSegments,
    ...legSegments,
  ];

  return (
    <div className="pose-canvas-scroll">
      <Stage
        className="pose-stage"
        height={spec.canvas.height}
        ref={stageRef}
        width={spec.canvas.width}
      >
        <Layer>
          {spec.canvas.background !== "transparent" ? (
            <Rect
              fill={spec.canvas.background === "grid" ? "#FBFCFD" : "#FFFFFF"}
              height={spec.canvas.height}
              width={spec.canvas.width}
              x={0}
              y={0}
            />
          ) : null}

          {spec.canvas.background === "grid"
            ? gridLines.map((points, index) => (
                <Line
                  key={`grid-${index}`}
                  listening={false}
                  points={points}
                  stroke="#E6E8EC"
                  strokeWidth={1}
                />
              ))
            : null}

          <Human2DCharacterRenderer
            assets={human2dAssets}
            bodyStyle={spec.appearance.bodyStyle}
            model={human2dModel}
            pose={spec.pose2d}
            strokeWidth={spec.appearance.strokeWidth}
          />

          {human2dModel.showSkeleton
            ? guideSegments.map(([startJoint, endJoint]) => (
                <Line
                  dash={[8, 8]}
                  key={`${startJoint}-${endJoint}-guide`}
                  listening={false}
                  points={[
                    spec.pose2d[startJoint].x,
                    spec.pose2d[startJoint].y,
                    spec.pose2d[endJoint].x,
                    spec.pose2d[endJoint].y,
                  ]}
                  stroke={human2dModel.accentColor}
                  strokeWidth={bodyScale.guideStrokeWidth}
                  opacity={0.35}
                />
              ))
            : null}

          {human2dModel.showJointHandles
            ? pose2dJointKeys.map((joint) => {
                const isDraggable = poseDraggable2dJoints.includes(joint);
                const isSelected = selectedJoint === joint;

                return (
                  <Circle
                    draggable={isDraggable}
                    fill={isSelected ? human2dModel.accentColor : "#FFFFFF"}
                    key={joint}
                    radius={
                      isDraggable
                        ? bodyScale.handleRadius
                        : bodyScale.handleRadius - 3
                    }
                    shadowBlur={isSelected ? 10 : 0}
                    stroke={human2dModel.accentColor}
                    strokeWidth={isSelected ? 4 : 2}
                    x={spec.pose2d[joint].x}
                    y={spec.pose2d[joint].y}
                    onClick={() => onSelectJoint(joint)}
                    onDragMove={(event) =>
                      handleJointDragMove(joint, {
                        x: event.target.x(),
                        y: event.target.y(),
                      })
                    }
                  />
                );
              })
            : null}
        </Layer>
      </Stage>
    </div>
  );
}
