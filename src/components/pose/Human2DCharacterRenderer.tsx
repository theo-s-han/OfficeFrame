"use client";

import { getHuman2DAssetById } from "@/lib/pose/human2dAssets";
import type {
  Human2DCharacterAsset,
  Human2DModelState,
} from "@/lib/pose/human2dRigTypes";
import type { CharacterPoseSpec, Pose2D } from "@/lib/pose/poseSpec";
import { Human2DAssetRenderer } from "./Human2DAssetRenderer";
import {
  Human2DBuiltinCartoonRenderer,
  type BuiltinHuman2DVariant,
} from "./Human2DBuiltinCartoonRenderer";

type Human2DCharacterRendererProps = {
  assets: Human2DCharacterAsset[];
  bodyStyle: CharacterPoseSpec["appearance"]["bodyStyle"];
  model: Human2DModelState;
  pose: Pose2D;
  strokeWidth: number;
};

function getBuiltInVariant(assetId: string): BuiltinHuman2DVariant {
  switch (assetId) {
    case "builtin-office":
      return "office";
    case "builtin-casual":
      return "casual";
    case "builtin-hero":
      return "hero";
    default:
      return "cartoon";
  }
}

export function Human2DCharacterRenderer({
  assets,
  bodyStyle,
  model,
  pose,
  strokeWidth,
}: Human2DCharacterRendererProps) {
  const asset = getHuman2DAssetById(model.assetId, assets);

  if (!asset || asset.format === "builtin") {
    return (
      <Human2DBuiltinCartoonRenderer
        bodyStyle={bodyStyle}
        model={model}
        pose={pose}
        strokeWidth={strokeWidth}
        variant={getBuiltInVariant(asset?.id ?? model.assetId)}
      />
    );
  }

  return (
    <Human2DAssetRenderer
      asset={asset}
      bodyStyle={bodyStyle}
      model={model}
      pose={pose}
      strokeWidth={strokeWidth}
    />
  );
}
