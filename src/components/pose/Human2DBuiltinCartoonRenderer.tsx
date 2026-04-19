"use client";

import { Circle, Ellipse, Group, Line, Rect } from "react-konva";
import { getSegmentTransform } from "@/lib/pose/human2dRenderMath";
import type { Human2DModelState } from "@/lib/pose/human2dRigTypes";
import type {
  CharacterPoseSpec,
  Joint2D,
  Pose2D,
} from "@/lib/pose/poseSpec";

export type BuiltinHuman2DVariant =
  | "cartoon"
  | "office"
  | "casual"
  | "hero";

type Human2DBuiltinCartoonRendererProps = {
  bodyStyle: CharacterPoseSpec["appearance"]["bodyStyle"];
  model: Human2DModelState;
  pose: Pose2D;
  strokeWidth: number;
  variant?: BuiltinHuman2DVariant;
};

type CharacterSegmentProps = {
  color: string;
  fromJoint: Joint2D;
  pose: Pose2D;
  toJoint: Joint2D;
  width: number;
};

type JointCapProps = {
  color: string;
  joint: Joint2D;
  opacity?: number;
  pose: Pose2D;
  radius: number;
};

type BuiltinCharacterLook = {
  bootColor: string;
  cuffColor: string;
  faceColor: string;
  hairShape: "classic" | "neat" | "fluffy" | "swoop";
  limbColor: string;
  lowerLegColor: string;
  shoeColor: string;
  torsoMode: "cardigan" | "blazer" | "hoodie" | "jacket";
  torsoShade: string;
  trouserColor: string;
};

type BodyMetrics = {
  elbowRadius: number;
  footHeight: number;
  footWidth: number;
  handRadiusX: number;
  handRadiusY: number;
  headRadiusX: number;
  headRadiusY: number;
  hipRadius: number;
  kneeRadius: number;
  lowerArmWidth: number;
  lowerLegWidth: number;
  neckHeight: number;
  neckWidth: number;
  shoulderRadius: number;
  torsoHeight: number;
  torsoPivotY: number;
  torsoWidth: number;
  upperArmWidth: number;
  upperLegWidth: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHexColor(color: string) {
  const value = color.trim();

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value.toUpperCase();
  }

  if (/^#[0-9a-f]{3}$/i.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return null;
}

function mixHexColors(base: string, target: string, amount: number) {
  const normalizedBase = normalizeHexColor(base);
  const normalizedTarget = normalizeHexColor(target);

  if (!normalizedBase || !normalizedTarget) {
    return base;
  }

  const ratio = clamp(amount, 0, 1);
  const baseRgb = normalizedBase
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16));
  const targetRgb = normalizedTarget
    .slice(1)
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16));

  if (!baseRgb || !targetRgb) {
    return base;
  }

  const channels = baseRgb.map((channel, index) => {
    const mixed = Math.round(channel + (targetRgb[index] - channel) * ratio);
    return clamp(mixed, 0, 255).toString(16).padStart(2, "0");
  });

  return `#${channels.join("")}`.toUpperCase();
}

function tintHexColor(color: string, amount: number) {
  return mixHexColors(color, "#FFFFFF", amount);
}

function shadeHexColor(color: string, amount: number) {
  return mixHexColors(color, "#18212F", amount);
}

function getBodyMetrics(
  bodyStyle: CharacterPoseSpec["appearance"]["bodyStyle"],
): BodyMetrics {
  if (bodyStyle === "slim") {
    return {
      elbowRadius: 12,
      footHeight: 18,
      footWidth: 34,
      handRadiusX: 15,
      handRadiusY: 11,
      headRadiusX: 34,
      headRadiusY: 40,
      hipRadius: 15,
      kneeRadius: 14,
      lowerArmWidth: 22,
      lowerLegWidth: 28,
      neckHeight: 30,
      neckWidth: 20,
      shoulderRadius: 16,
      torsoHeight: 154,
      torsoPivotY: 20,
      torsoWidth: 96,
      upperArmWidth: 26,
      upperLegWidth: 34,
    };
  }

  if (bodyStyle === "broad") {
    return {
      elbowRadius: 16,
      footHeight: 22,
      footWidth: 44,
      handRadiusX: 18,
      handRadiusY: 13,
      headRadiusX: 42,
      headRadiusY: 46,
      hipRadius: 19,
      kneeRadius: 18,
      lowerArmWidth: 28,
      lowerLegWidth: 34,
      neckHeight: 34,
      neckWidth: 24,
      shoulderRadius: 20,
      torsoHeight: 172,
      torsoPivotY: 22,
      torsoWidth: 124,
      upperArmWidth: 32,
      upperLegWidth: 40,
    };
  }

  return {
    elbowRadius: 14,
    footHeight: 20,
    footWidth: 38,
    handRadiusX: 16,
    handRadiusY: 12,
    headRadiusX: 38,
    headRadiusY: 43,
    hipRadius: 17,
    kneeRadius: 16,
    lowerArmWidth: 24,
    lowerLegWidth: 30,
    neckHeight: 32,
    neckWidth: 22,
    shoulderRadius: 18,
    torsoHeight: 162,
    torsoPivotY: 21,
    torsoWidth: 108,
    upperArmWidth: 28,
    upperLegWidth: 36,
  };
}

function getCharacterLook(
  variant: BuiltinHuman2DVariant,
  model: Human2DModelState,
): BuiltinCharacterLook {
  switch (variant) {
    case "office":
      return {
        bootColor: shadeHexColor(model.clothColor, 0.44),
        cuffColor: tintHexColor(model.accentColor, 0.12),
        faceColor: "#8C4C51",
        hairShape: "neat",
        limbColor: shadeHexColor(model.clothColor, 0.14),
        lowerLegColor: shadeHexColor(model.clothColor, 0.08),
        shoeColor: shadeHexColor(model.clothColor, 0.58),
        torsoMode: "blazer",
        torsoShade: shadeHexColor(model.clothColor, 0.16),
        trouserColor: shadeHexColor(model.clothColor, 0.22),
      };
    case "casual":
      return {
        bootColor: "#F8FAFC",
        cuffColor: tintHexColor(model.accentColor, 0.24),
        faceColor: "#8C4C51",
        hairShape: "fluffy",
        limbColor: tintHexColor(model.clothColor, 0.06),
        lowerLegColor: shadeHexColor(model.clothColor, 0.08),
        shoeColor: "#F8FAFC",
        torsoMode: "hoodie",
        torsoShade: tintHexColor(model.clothColor, 0.02),
        trouserColor: shadeHexColor(model.clothColor, 0.2),
      };
    case "hero":
      return {
        bootColor: shadeHexColor(model.accentColor, 0.42),
        cuffColor: model.accentColor,
        faceColor: "#7A3F49",
        hairShape: "swoop",
        limbColor: shadeHexColor(model.clothColor, 0.18),
        lowerLegColor: shadeHexColor(model.clothColor, 0.28),
        shoeColor: shadeHexColor(model.accentColor, 0.42),
        torsoMode: "jacket",
        torsoShade: shadeHexColor(model.clothColor, 0.22),
        trouserColor: shadeHexColor(model.clothColor, 0.24),
      };
    default:
      return {
        bootColor: "#F8FAFC",
        cuffColor: model.accentColor,
        faceColor: "#8C4C51",
        hairShape: "classic",
        limbColor: model.clothColor,
        lowerLegColor: shadeHexColor(model.clothColor, 0.08),
        shoeColor: "#F8FAFC",
        torsoMode: "cardigan",
        torsoShade: model.clothColor,
        trouserColor: shadeHexColor(model.clothColor, 0.1),
      };
  }
}

function CharacterSegment({
  color,
  fromJoint,
  pose,
  toJoint,
  width,
}: CharacterSegmentProps) {
  const from = pose[fromJoint];
  const to = pose[toJoint];
  const transform = getSegmentTransform({
    from,
    to,
    sourceHeight: 100,
    pivot: {
      x: width / 2,
      y: 0,
    },
  });

  return (
    <Rect
      cornerRadius={width / 2}
      fill={color}
      height={100}
      offsetX={width / 2}
      offsetY={0}
      rotation={transform.rotationDeg}
      scaleY={transform.scaleY}
      width={width}
      x={transform.x}
      y={transform.y}
    />
  );
}

function JointCap({ color, joint, opacity = 1, pose, radius }: JointCapProps) {
  return (
    <Circle
      fill={color}
      opacity={opacity}
      radius={radius}
      x={pose[joint].x}
      y={pose[joint].y}
    />
  );
}

function FaceGroup({
  hairColor,
  headRadiusX,
  headRadiusY,
  pose,
  skinColor,
  variant,
}: {
  hairColor: string;
  headRadiusX: number;
  headRadiusY: number;
  pose: Pose2D;
  skinColor: string;
  variant: BuiltinCharacterLook["hairShape"];
}) {
  const rotation =
    (Math.atan2(pose.neck.y - pose.head.y, pose.neck.x - pose.head.x) * 180) /
      Math.PI -
    90;

  return (
    <Group rotation={rotation} x={pose.head.x} y={pose.head.y}>
      <Ellipse fill={skinColor} radiusX={headRadiusX} radiusY={headRadiusY} />

      {variant === "neat" ? (
        <>
          <Line
            closed
            fill={hairColor}
            points={[
              -headRadiusX * 0.96,
              -headRadiusY * 0.12,
              -headRadiusX * 0.82,
              -headRadiusY,
              headRadiusX * 0.38,
              -headRadiusY * 0.98,
              headRadiusX,
              -headRadiusY * 0.2,
              headRadiusX * 0.46,
              -headRadiusY * 0.02,
              -headRadiusX * 0.46,
              0,
            ]}
          />
          <Line
            fill={shadeHexColor(hairColor, 0.1)}
            lineCap="round"
            points={[
              headRadiusX * 0.08,
              -headRadiusY * 0.92,
              -headRadiusX * 0.18,
              -headRadiusY * 0.28,
            ]}
            stroke={shadeHexColor(hairColor, 0.12)}
            strokeWidth={6}
          />
        </>
      ) : null}

      {variant === "fluffy" ? (
        <Line
          closed
          fill={hairColor}
          points={[
            -headRadiusX,
            -headRadiusY * 0.06,
            -headRadiusX * 0.96,
            -headRadiusY * 0.86,
            -headRadiusX * 0.48,
            -headRadiusY * 1.08,
            -headRadiusX * 0.08,
            -headRadiusY * 0.82,
            headRadiusX * 0.18,
            -headRadiusY * 1.02,
            headRadiusX * 0.56,
            -headRadiusY * 0.78,
            headRadiusX * 0.98,
            -headRadiusY * 0.18,
            headRadiusX * 0.74,
            headRadiusY * 0.04,
            -headRadiusX * 0.68,
            headRadiusY * 0.02,
          ]}
        />
      ) : null}

      {variant === "swoop" ? (
        <>
          <Line
            closed
            fill={hairColor}
            points={[
              -headRadiusX * 0.96,
              -headRadiusY * 0.04,
              -headRadiusX * 0.72,
              -headRadiusY * 0.92,
              headRadiusX * 0.28,
              -headRadiusY * 1.02,
              headRadiusX * 1.06,
              -headRadiusY * 0.36,
              headRadiusX * 0.58,
              headRadiusY * 0.02,
              -headRadiusX * 0.72,
              headRadiusY * 0.02,
            ]}
          />
          <Line
            lineCap="round"
            points={[
              headRadiusX * 0.34,
              -headRadiusY * 0.74,
              headRadiusX * 0.64,
              -headRadiusY * 0.36,
              headRadiusX * 0.14,
              -headRadiusY * 0.1,
            ]}
            stroke={shadeHexColor(hairColor, 0.2)}
            strokeWidth={8}
          />
        </>
      ) : null}

      {variant === "classic" ? (
        <Line
          closed
          fill={hairColor}
          points={[
            -headRadiusX,
            -headRadiusY * 0.15,
            -headRadiusX * 0.66,
            -headRadiusY * 0.92,
            headRadiusX * 0.62,
            -headRadiusY * 0.92,
            headRadiusX,
            -headRadiusY * 0.08,
            headRadiusX * 0.74,
            headRadiusY * 0.06,
            -headRadiusX * 0.74,
            headRadiusY * 0.06,
          ]}
        />
      ) : null}

      <Circle fill="#2B3342" radius={3.6} x={-headRadiusX * 0.28} y={-2} />
      <Circle fill="#2B3342" radius={3.6} x={headRadiusX * 0.28} y={-2} />
      <Line
        lineCap="round"
        points={[
          -7,
          headRadiusY * 0.26,
          0,
          headRadiusY * 0.34,
          7,
          headRadiusY * 0.26,
        ]}
        stroke="#8C4C51"
        strokeWidth={3}
      />
    </Group>
  );
}

function TorsoGroup({
  accentColor,
  look,
  metrics,
  pose,
}: {
  accentColor: string;
  look: BuiltinCharacterLook;
  metrics: BodyMetrics;
  pose: Pose2D;
}) {
  const torsoTransform = getSegmentTransform({
    from: pose.chest,
    to: pose.pelvis,
    sourceHeight: metrics.torsoHeight,
    pivot: {
      x: metrics.torsoWidth / 2,
      y: metrics.torsoPivotY,
    },
  });
  const shirtColor = tintHexColor(look.torsoShade, 0.78);

  return (
    <Group
      rotation={torsoTransform.rotationDeg}
      x={torsoTransform.x}
      y={torsoTransform.y}
    >
      {look.torsoMode === "hoodie" ? (
        <Ellipse
          fill={shadeHexColor(look.torsoShade, 0.1)}
          opacity={0.7}
          radiusX={metrics.torsoWidth * 0.34}
          radiusY={22}
          scaleY={torsoTransform.scaleY}
          x={0}
          y={metrics.torsoPivotY + 4}
        />
      ) : null}

      <Rect
        cornerRadius={look.torsoMode === "jacket" ? 22 : 26}
        fill={look.torsoShade}
        height={metrics.torsoHeight}
        offsetX={metrics.torsoWidth / 2}
        offsetY={metrics.torsoPivotY}
        scaleY={torsoTransform.scaleY}
        shadowBlur={12}
        shadowColor="rgba(36, 48, 66, 0.18)"
        width={metrics.torsoWidth}
      />

      {look.torsoMode === "cardigan" ? (
        <>
          <Rect
            cornerRadius={18}
            fill={accentColor}
            height={36}
            offsetX={metrics.torsoWidth / 2}
            offsetY={-6}
            opacity={0.82}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.64}
          />
          <Rect
            cornerRadius={18}
            fill="#F1F5F9"
            height={40}
            offsetX={metrics.torsoWidth / 2}
            offsetY={metrics.torsoHeight - 28}
            opacity={0.95}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.84}
          />
        </>
      ) : null}

      {look.torsoMode === "blazer" ? (
        <>
          <Rect
            cornerRadius={18}
            fill={shirtColor}
            height={metrics.torsoHeight * 0.84}
            offsetX={metrics.torsoWidth * 0.15}
            offsetY={metrics.torsoPivotY - 16}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.3}
          />
          <Line
            closed
            fill={tintHexColor(look.torsoShade, 0.16)}
            points={[
              -metrics.torsoWidth * 0.44,
              -metrics.torsoPivotY + 16,
              -metrics.torsoWidth * 0.12,
              16,
              -metrics.torsoWidth * 0.28,
              metrics.torsoHeight * 0.22,
            ]}
            scaleY={torsoTransform.scaleY}
          />
          <Line
            closed
            fill={tintHexColor(look.torsoShade, 0.16)}
            points={[
              metrics.torsoWidth * 0.44,
              -metrics.torsoPivotY + 16,
              metrics.torsoWidth * 0.12,
              16,
              metrics.torsoWidth * 0.28,
              metrics.torsoHeight * 0.22,
            ]}
            scaleY={torsoTransform.scaleY}
          />
          <Line
            lineCap="round"
            points={[0, 10, 0, metrics.torsoHeight * 0.78]}
            scaleY={torsoTransform.scaleY}
            stroke={shadeHexColor(look.torsoShade, 0.32)}
            strokeWidth={3}
          />
          <Line
            closed
            fill={accentColor}
            points={[
              0,
              18,
              -12,
              48,
              0,
              108,
              12,
              48,
            ]}
            scaleY={torsoTransform.scaleY}
          />
        </>
      ) : null}

      {look.torsoMode === "hoodie" ? (
        <>
          <Rect
            cornerRadius={18}
            fill={tintHexColor(look.torsoShade, 0.12)}
            height={metrics.torsoHeight * 0.22}
            offsetX={metrics.torsoWidth / 2}
            offsetY={metrics.torsoHeight * 0.56}
            opacity={0.9}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.46}
          />
          <Line
            lineCap="round"
            points={[-10, 10, -8, 52]}
            scaleY={torsoTransform.scaleY}
            stroke={accentColor}
            strokeWidth={3}
          />
          <Line
            lineCap="round"
            points={[10, 10, 8, 52]}
            scaleY={torsoTransform.scaleY}
            stroke={accentColor}
            strokeWidth={3}
          />
          <Rect
            cornerRadius={18}
            fill={accentColor}
            height={18}
            offsetX={metrics.torsoWidth / 2}
            offsetY={metrics.torsoHeight - 14}
            opacity={0.7}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.86}
          />
        </>
      ) : null}

      {look.torsoMode === "jacket" ? (
        <>
          <Rect
            cornerRadius={16}
            fill={shadeHexColor(look.torsoShade, 0.24)}
            height={metrics.torsoHeight * 0.18}
            offsetX={metrics.torsoWidth / 2}
            offsetY={-8}
            opacity={0.74}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.72}
          />
          <Rect
            cornerRadius={16}
            fill={accentColor}
            height={14}
            offsetX={metrics.torsoWidth / 2}
            offsetY={metrics.torsoHeight * 0.46}
            opacity={0.88}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.9}
          />
          <Rect
            cornerRadius={16}
            fill={tintHexColor(accentColor, 0.52)}
            height={metrics.torsoHeight * 0.28}
            offsetX={metrics.torsoWidth * 0.12}
            offsetY={metrics.torsoHeight * 0.16}
            opacity={0.84}
            scaleY={torsoTransform.scaleY}
            width={metrics.torsoWidth * 0.24}
          />
        </>
      ) : null}
    </Group>
  );
}

function NeckSegment({
  color,
  metrics,
  pose,
}: {
  color: string;
  metrics: BodyMetrics;
  pose: Pose2D;
}) {
  const transform = getSegmentTransform({
    from: pose.neck,
    to: pose.chest,
    sourceHeight: metrics.neckHeight,
    pivot: {
      x: metrics.neckWidth / 2,
      y: 0,
    },
  });

  return (
    <Rect
      cornerRadius={metrics.neckWidth / 2}
      fill={color}
      height={metrics.neckHeight}
      offsetX={metrics.neckWidth / 2}
      offsetY={0}
      rotation={transform.rotationDeg}
      scaleY={transform.scaleY}
      width={metrics.neckWidth}
      x={transform.x}
      y={transform.y}
    />
  );
}

export function Human2DBuiltinCartoonRenderer({
  bodyStyle,
  model,
  pose,
  strokeWidth,
  variant = "cartoon",
}: Human2DBuiltinCartoonRendererProps) {
  if (!model.showCharacter) {
    return null;
  }

  const metrics = getBodyMetrics(bodyStyle);
  const look = getCharacterLook(variant, model);
  const outlineColor = "#243042";
  const stroke = Math.max(2, strokeWidth * 0.16);

  return (
    <>
      <CharacterSegment
        color={look.trouserColor}
        fromJoint="leftHip"
        pose={pose}
        toJoint="leftKnee"
        width={metrics.upperLegWidth}
      />
      <CharacterSegment
        color={look.trouserColor}
        fromJoint="rightHip"
        pose={pose}
        toJoint="rightKnee"
        width={metrics.upperLegWidth}
      />
      <CharacterSegment
        color={look.lowerLegColor}
        fromJoint="leftKnee"
        pose={pose}
        toJoint="leftAnkle"
        width={metrics.lowerLegWidth}
      />
      <CharacterSegment
        color={look.lowerLegColor}
        fromJoint="rightKnee"
        pose={pose}
        toJoint="rightAnkle"
        width={metrics.lowerLegWidth}
      />

      <JointCap
        color={look.trouserColor}
        joint="leftHip"
        pose={pose}
        radius={metrics.hipRadius}
      />
      <JointCap
        color={look.trouserColor}
        joint="rightHip"
        pose={pose}
        radius={metrics.hipRadius}
      />
      <JointCap
        color={look.lowerLegColor}
        joint="leftKnee"
        pose={pose}
        radius={metrics.kneeRadius}
      />
      <JointCap
        color={look.lowerLegColor}
        joint="rightKnee"
        pose={pose}
        radius={metrics.kneeRadius}
      />

      <TorsoGroup
        accentColor={model.accentColor}
        look={look}
        metrics={metrics}
        pose={pose}
      />
      <NeckSegment color={model.skinColor} metrics={metrics} pose={pose} />

      <CharacterSegment
        color={look.limbColor}
        fromJoint="leftShoulder"
        pose={pose}
        toJoint="leftElbow"
        width={metrics.upperArmWidth}
      />
      <CharacterSegment
        color={look.limbColor}
        fromJoint="rightShoulder"
        pose={pose}
        toJoint="rightElbow"
        width={metrics.upperArmWidth}
      />
      <CharacterSegment
        color={model.skinColor}
        fromJoint="leftElbow"
        pose={pose}
        toJoint="leftWrist"
        width={metrics.lowerArmWidth}
      />
      <CharacterSegment
        color={model.skinColor}
        fromJoint="rightElbow"
        pose={pose}
        toJoint="rightWrist"
        width={metrics.lowerArmWidth}
      />

      <JointCap
        color={look.limbColor}
        joint="leftShoulder"
        pose={pose}
        radius={metrics.shoulderRadius}
      />
      <JointCap
        color={look.limbColor}
        joint="rightShoulder"
        pose={pose}
        radius={metrics.shoulderRadius}
      />
      <JointCap
        color={model.skinColor}
        joint="leftElbow"
        pose={pose}
        radius={metrics.elbowRadius}
      />
      <JointCap
        color={model.skinColor}
        joint="rightElbow"
        pose={pose}
        radius={metrics.elbowRadius}
      />

      <Rect
        cornerRadius={10}
        fill={look.cuffColor}
        height={16}
        offsetX={14}
        offsetY={8}
        rotation={
          (Math.atan2(
            pose.leftWrist.y - pose.leftElbow.y,
            pose.leftWrist.x - pose.leftElbow.x,
          ) *
            180) /
            Math.PI +
          4
        }
        width={28}
        x={pose.leftWrist.x}
        y={pose.leftWrist.y}
      />
      <Rect
        cornerRadius={10}
        fill={look.cuffColor}
        height={16}
        offsetX={14}
        offsetY={8}
        rotation={
          (Math.atan2(
            pose.rightWrist.y - pose.rightElbow.y,
            pose.rightWrist.x - pose.rightElbow.x,
          ) *
            180) /
            Math.PI -
          4
        }
        width={28}
        x={pose.rightWrist.x}
        y={pose.rightWrist.y}
      />

      <Ellipse
        fill={model.skinColor}
        radiusX={metrics.handRadiusX}
        radiusY={metrics.handRadiusY}
        rotation={
          (Math.atan2(
            pose.leftWrist.y - pose.leftElbow.y,
            pose.leftWrist.x - pose.leftElbow.x,
          ) *
            180) /
            Math.PI +
          8
        }
        x={pose.leftWrist.x}
        y={pose.leftWrist.y}
      />
      <Ellipse
        fill={model.skinColor}
        radiusX={metrics.handRadiusX}
        radiusY={metrics.handRadiusY}
        rotation={
          (Math.atan2(
            pose.rightWrist.y - pose.rightElbow.y,
            pose.rightWrist.x - pose.rightElbow.x,
          ) *
            180) /
            Math.PI -
          8
        }
        x={pose.rightWrist.x}
        y={pose.rightWrist.y}
      />

      <FaceGroup
        hairColor={model.hairColor}
        headRadiusX={metrics.headRadiusX}
        headRadiusY={metrics.headRadiusY}
        pose={pose}
        skinColor={model.skinColor}
        variant={look.hairShape}
      />

      <Ellipse
        fill={look.bootColor}
        radiusX={metrics.footWidth / 2}
        radiusY={metrics.footHeight / 2}
        rotation={
          (Math.atan2(
            pose.leftAnkle.y - pose.leftKnee.y,
            pose.leftAnkle.x - pose.leftKnee.x,
          ) *
            180) /
            Math.PI -
          90
        }
        stroke={outlineColor}
        strokeWidth={stroke}
        x={pose.leftAnkle.x}
        y={pose.leftAnkle.y + 4}
      />
      <Ellipse
        fill={look.shoeColor}
        radiusX={metrics.footWidth * 0.24}
        radiusY={metrics.footHeight * 0.16}
        rotation={
          (Math.atan2(
            pose.leftAnkle.y - pose.leftKnee.y,
            pose.leftAnkle.x - pose.leftKnee.x,
          ) *
            180) /
            Math.PI -
          90
        }
        x={pose.leftAnkle.x + 1}
        y={pose.leftAnkle.y + 5}
      />
      <Ellipse
        fill={look.bootColor}
        radiusX={metrics.footWidth / 2}
        radiusY={metrics.footHeight / 2}
        rotation={
          (Math.atan2(
            pose.rightAnkle.y - pose.rightKnee.y,
            pose.rightAnkle.x - pose.rightKnee.x,
          ) *
            180) /
            Math.PI -
          90
        }
        stroke={outlineColor}
        strokeWidth={stroke}
        x={pose.rightAnkle.x}
        y={pose.rightAnkle.y + 4}
      />
      <Ellipse
        fill={look.shoeColor}
        radiusX={metrics.footWidth * 0.24}
        radiusY={metrics.footHeight * 0.16}
        rotation={
          (Math.atan2(
            pose.rightAnkle.y - pose.rightKnee.y,
            pose.rightAnkle.x - pose.rightKnee.x,
          ) *
            180) /
            Math.PI -
          90
        }
        x={pose.rightAnkle.x + 1}
        y={pose.rightAnkle.y + 5}
      />
    </>
  );
}
