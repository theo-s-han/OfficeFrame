"use client";

import { useMemo, useState } from "react";
import { Group, Rect, Text } from "react-konva";
import { getAngleRadians, getDistance, getSegmentTransform, radiansToDegrees } from "@/lib/pose/human2dRenderMath";
import { createHuman2DSvgTokenMap } from "@/lib/pose/human2dSvgTemplate";
import type {
  Human2DCharacterAsset,
  Human2DModelState,
  Human2DPartDefinition,
} from "@/lib/pose/human2dRigTypes";
import type { CharacterPoseSpec, Pose2D } from "@/lib/pose/poseSpec";
import { Human2DPartImage } from "./Human2DPartImage";
import { Human2DBuiltinCartoonRenderer } from "./Human2DBuiltinCartoonRenderer";

type Human2DAssetRendererProps = {
  asset: Human2DCharacterAsset;
  bodyStyle: CharacterPoseSpec["appearance"]["bodyStyle"];
  model: Human2DModelState;
  pose: Pose2D;
  strokeWidth: number;
};

type PartStatus = {
  error: string;
  status: "idle" | "loading" | "loaded" | "error";
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getWarningLines(message: string) {
  return message.split("\n");
}

function getAnchoredRotationDeg(part: Human2DPartDefinition, pose: Pose2D) {
  switch (part.kind) {
    case "head":
    case "hair":
    case "face":
      return radiansToDegrees(getAngleRadians(pose.head, pose.neck)) - 90;
    case "torso":
      return radiansToDegrees(getAngleRadians(pose.chest, pose.pelvis)) - 90;
    case "hand":
      if (part.id.startsWith("left")) {
        return radiansToDegrees(getAngleRadians(pose.leftElbow, pose.leftWrist)) - 90;
      }

      if (part.id.startsWith("right")) {
        return radiansToDegrees(getAngleRadians(pose.rightElbow, pose.rightWrist)) - 90;
      }

      return 0;
    case "foot":
      if (part.id.startsWith("left")) {
        return radiansToDegrees(getAngleRadians(pose.leftKnee, pose.leftAnkle)) - 90;
      }

      if (part.id.startsWith("right")) {
        return radiansToDegrees(getAngleRadians(pose.rightKnee, pose.rightAnkle)) - 90;
      }

      return 0;
    default:
      return 0;
  }
}

function getAnchoredScaleY(part: Human2DPartDefinition, pose: Pose2D) {
  if (part.kind !== "torso") {
    return 1;
  }

  const torsoLength = getDistance(pose.chest, pose.pelvis);
  const drawableHeight = Math.max(1, part.height - part.pivot.y);

  return clamp(torsoLength / drawableHeight, 0.8, 1.45);
}

function WarningOverlay({ message }: { message: string }) {
  const lines = getWarningLines(message);
  const height = 18 + lines.length * 20;

  return (
    <Group x={20} y={18}>
      <Rect
        cornerRadius={12}
        fill="rgba(255, 248, 237, 0.96)"
        height={height}
        shadowBlur={12}
        shadowColor="rgba(15, 23, 42, 0.1)"
        width={460}
      />
      <Text
        fill="#8A6118"
        fontSize={14}
        fontStyle="bold"
        lineHeight={1.4}
        padding={12}
        text={message}
        width={460}
      />
    </Group>
  );
}

export function Human2DAssetRenderer({
  asset,
  bodyStyle,
  model,
  pose,
  strokeWidth,
}: Human2DAssetRendererProps) {
  const sortedParts = useMemo(
    () => [...asset.parts].sort((left, right) => left.zIndex - right.zIndex),
    [asset.parts],
  );
  const svgTokenMap = useMemo(
    () =>
      createHuman2DSvgTokenMap({
        skinColor: model.skinColor,
        clothColor: model.clothColor,
        hairColor: model.hairColor,
        accentColor: model.accentColor,
      }),
    [model.accentColor, model.clothColor, model.hairColor, model.skinColor],
  );
  const [partStatusMap, setPartStatusMap] = useState<Record<string, PartStatus>>({});

  const expectedPartIds = sortedParts
    .filter((part) => Boolean(part.src))
    .map((part) => part.id);
  const resolvedPartCount = expectedPartIds.filter((partId) => {
    const status = partStatusMap[partId]?.status;

    return status === "loaded" || status === "error";
  }).length;
  const loadedPartCount = expectedPartIds.filter(
    (partId) => partStatusMap[partId]?.status === "loaded",
  ).length;
  const failedPartIds = expectedPartIds.filter(
    (partId) => partStatusMap[partId]?.status === "error",
  );
  const allPartsFailed =
    model.showCharacter &&
    expectedPartIds.length > 0 &&
    resolvedPartCount === expectedPartIds.length &&
    loadedPartCount === 0;

  if (!model.showCharacter) {
    return null;
  }

  if (allPartsFailed) {
    return (
      <>
        <Human2DBuiltinCartoonRenderer
          bodyStyle={bodyStyle}
          model={model}
          pose={pose}
          strokeWidth={strokeWidth}
        />
        <WarningOverlay
          message={`"${asset.label}" asset could not be rendered. Built-in cartoon fallback is shown instead.`}
        />
      </>
    );
  }

  return (
    <>
      {sortedParts.map((part) => {
        if (!part.src) {
          return null;
        }

        if (part.renderMode === "between-joints" && part.fromJoint && part.toJoint) {
          const transform = getSegmentTransform({
            from: pose[part.fromJoint],
            to: pose[part.toJoint],
            sourceHeight: part.height,
            pivot: {
              x: part.pivot.x,
              y: part.pivot.y,
            },
          });

          return (
            <Human2DPartImage
              height={part.height}
              key={part.id}
              offsetX={part.pivot.x}
              offsetY={part.pivot.y}
              rotation={transform.rotationDeg}
              scaleX={part.mirrorX ? -1 : 1}
              scaleY={transform.scaleY}
              src={part.src}
              svgTokenMap={svgTokenMap}
              width={part.width}
              x={transform.x + (part.offset?.x ?? 0)}
              y={transform.y + (part.offset?.y ?? 0)}
              onStatusChange={(status, error) => {
                setPartStatusMap((current) => {
                  const previous = current[part.id];

                  if (
                    previous &&
                    previous.status === status &&
                    previous.error === error
                  ) {
                    return current;
                  }

                  return {
                    ...current,
                    [part.id]: {
                      error,
                      status,
                    },
                  };
                });
              }}
            />
          );
        }

        if (part.renderMode === "anchored" && part.anchorJoint) {
          const anchor = pose[part.anchorJoint];

          return (
            <Human2DPartImage
              height={part.height}
              key={part.id}
              offsetX={part.pivot.x}
              offsetY={part.pivot.y}
              rotation={getAnchoredRotationDeg(part, pose)}
              scaleX={part.mirrorX ? -1 : 1}
              scaleY={getAnchoredScaleY(part, pose)}
              src={part.src}
              svgTokenMap={svgTokenMap}
              width={part.width}
              x={anchor.x + (part.offset?.x ?? 0)}
              y={anchor.y + (part.offset?.y ?? 0)}
              onStatusChange={(status, error) => {
                setPartStatusMap((current) => {
                  const previous = current[part.id];

                  if (
                    previous &&
                    previous.status === status &&
                    previous.error === error
                  ) {
                    return current;
                  }

                  return {
                    ...current,
                    [part.id]: {
                      error,
                      status,
                    },
                  };
                });
              }}
            />
          );
        }

        return null;
      })}

      {failedPartIds.length > 0 ? (
        <WarningOverlay
          message={`Some character parts failed to load: ${failedPartIds.join(", ")}.`}
        />
      ) : null}
    </>
  );
}
