import { useEffect, useState } from "react";
import type {
  Human2DAssetManifest,
  Human2DCharacterAsset,
  Human2DCharacterStyle,
  Human2DModelState,
} from "./human2dRigTypes";
import { validateHuman2DAsset } from "./validateHuman2DAsset";

const human2dStyleValues = new Set<Human2DCharacterStyle>([
  "builtin-cartoon",
  "open-peeps",
  "humaaans",
  "kenney",
  "custom",
]);

export const HUMAN_2D_ASSET_MANIFEST_PATH = "/assets/pose/2d/human/manifest.json";

function createStudioPoseAsset(args: {
  accessorySrc?: string;
  hairSrc: string;
  id: string;
  label: string;
  torsoSrc: string;
}) {
  return {
    id: args.id,
    label: args.label,
    style: "custom" as const,
    format: "segmented-svg" as const,
    license: "Internal studio SVG rig pack for pose editing.",
    sourceName: "Generated in project",
    attributionRequired: false,
    parts: [
      {
        id: "leftUpperLeg",
        kind: "upperLeg" as const,
        src: "/assets/pose/2d/human/studio-core/upper-leg.svg",
        renderMode: "between-joints" as const,
        fromJoint: "leftHip" as const,
        toJoint: "leftKnee" as const,
        width: 54,
        height: 148,
        pivot: { x: 27, y: 12 },
        zIndex: 10,
        tintRole: "cloth" as const,
      },
      {
        id: "rightUpperLeg",
        kind: "upperLeg" as const,
        src: "/assets/pose/2d/human/studio-core/upper-leg.svg",
        renderMode: "between-joints" as const,
        fromJoint: "rightHip" as const,
        toJoint: "rightKnee" as const,
        width: 54,
        height: 148,
        pivot: { x: 27, y: 12 },
        zIndex: 10,
        mirrorX: true,
        tintRole: "cloth" as const,
      },
      {
        id: "leftLowerLeg",
        kind: "lowerLeg" as const,
        src: "/assets/pose/2d/human/studio-core/lower-leg.svg",
        renderMode: "between-joints" as const,
        fromJoint: "leftKnee" as const,
        toJoint: "leftAnkle" as const,
        width: 48,
        height: 138,
        pivot: { x: 24, y: 10 },
        zIndex: 11,
        tintRole: "cloth" as const,
      },
      {
        id: "rightLowerLeg",
        kind: "lowerLeg" as const,
        src: "/assets/pose/2d/human/studio-core/lower-leg.svg",
        renderMode: "between-joints" as const,
        fromJoint: "rightKnee" as const,
        toJoint: "rightAnkle" as const,
        width: 48,
        height: 138,
        pivot: { x: 24, y: 10 },
        zIndex: 11,
        mirrorX: true,
        tintRole: "cloth" as const,
      },
      {
        id: "leftFoot",
        kind: "foot" as const,
        src: "/assets/pose/2d/human/studio-core/foot.svg",
        renderMode: "anchored" as const,
        anchorJoint: "leftAnkle" as const,
        width: 74,
        height: 40,
        pivot: { x: 24, y: 15 },
        zIndex: 12,
        tintRole: "accent" as const,
      },
      {
        id: "rightFoot",
        kind: "foot" as const,
        src: "/assets/pose/2d/human/studio-core/foot.svg",
        renderMode: "anchored" as const,
        anchorJoint: "rightAnkle" as const,
        width: 74,
        height: 40,
        pivot: { x: 24, y: 15 },
        zIndex: 12,
        mirrorX: true,
        tintRole: "accent" as const,
      },
      {
        id: "torso",
        kind: "torso" as const,
        src: args.torsoSrc,
        renderMode: "anchored" as const,
        anchorJoint: "chest" as const,
        width: 170,
        height: 214,
        pivot: { x: 85, y: 36 },
        zIndex: 20,
        tintRole: "cloth" as const,
      },
      {
        id: "leftUpperArm",
        kind: "upperArm" as const,
        src: "/assets/pose/2d/human/studio-core/upper-arm.svg",
        renderMode: "between-joints" as const,
        fromJoint: "leftShoulder" as const,
        toJoint: "leftElbow" as const,
        width: 56,
        height: 132,
        pivot: { x: 28, y: 10 },
        zIndex: 21,
        tintRole: "cloth" as const,
      },
      {
        id: "rightUpperArm",
        kind: "upperArm" as const,
        src: "/assets/pose/2d/human/studio-core/upper-arm.svg",
        renderMode: "between-joints" as const,
        fromJoint: "rightShoulder" as const,
        toJoint: "rightElbow" as const,
        width: 56,
        height: 132,
        pivot: { x: 28, y: 10 },
        zIndex: 21,
        mirrorX: true,
        tintRole: "cloth" as const,
      },
      {
        id: "leftLowerArm",
        kind: "lowerArm" as const,
        src: "/assets/pose/2d/human/studio-core/lower-arm.svg",
        renderMode: "between-joints" as const,
        fromJoint: "leftElbow" as const,
        toJoint: "leftWrist" as const,
        width: 46,
        height: 126,
        pivot: { x: 23, y: 10 },
        zIndex: 22,
        tintRole: "skin" as const,
      },
      {
        id: "rightLowerArm",
        kind: "lowerArm" as const,
        src: "/assets/pose/2d/human/studio-core/lower-arm.svg",
        renderMode: "between-joints" as const,
        fromJoint: "rightElbow" as const,
        toJoint: "rightWrist" as const,
        width: 46,
        height: 126,
        pivot: { x: 23, y: 10 },
        zIndex: 22,
        mirrorX: true,
        tintRole: "skin" as const,
      },
      {
        id: "leftHand",
        kind: "hand" as const,
        src: "/assets/pose/2d/human/studio-core/hand.svg",
        renderMode: "anchored" as const,
        anchorJoint: "leftWrist" as const,
        width: 54,
        height: 44,
        pivot: { x: 21, y: 14 },
        zIndex: 23,
        tintRole: "skin" as const,
      },
      {
        id: "rightHand",
        kind: "hand" as const,
        src: "/assets/pose/2d/human/studio-core/hand.svg",
        renderMode: "anchored" as const,
        anchorJoint: "rightWrist" as const,
        width: 54,
        height: 44,
        pivot: { x: 21, y: 14 },
        zIndex: 23,
        mirrorX: true,
        tintRole: "skin" as const,
      },
      {
        id: "head",
        kind: "head" as const,
        src: "/assets/pose/2d/human/studio-core/head.svg",
        renderMode: "anchored" as const,
        anchorJoint: "head" as const,
        width: 116,
        height: 122,
        pivot: { x: 58, y: 88 },
        zIndex: 50,
        tintRole: "skin" as const,
      },
      {
        id: "hair",
        kind: "hair" as const,
        src: args.hairSrc,
        renderMode: "anchored" as const,
        anchorJoint: "head" as const,
        width: 116,
        height: 122,
        pivot: { x: 58, y: 88 },
        zIndex: 51,
        tintRole: "hair" as const,
      },
      ...(args.accessorySrc
        ? [
            {
              id: "accessory",
              kind: "accessory" as const,
              src: args.accessorySrc,
              renderMode: "anchored" as const,
              anchorJoint: "head" as const,
              width: 116,
              height: 122,
              pivot: { x: 58, y: 88 },
              zIndex: 52,
              tintRole: "accent" as const,
            },
          ]
        : []),
    ],
  };
}

export const HUMAN_2D_CHARACTER_ASSETS: Human2DCharacterAsset[] = [
  createStudioPoseAsset({
    id: "studio-office",
    label: "Studio Office Human",
    torsoSrc: "/assets/pose/2d/human/studio-office/torso.svg",
    hairSrc: "/assets/pose/2d/human/studio-office/hair.svg",
    accessorySrc: "/assets/pose/2d/human/studio-office/accessory.svg",
  }),
  createStudioPoseAsset({
    id: "studio-casual",
    label: "Studio Casual Human",
    torsoSrc: "/assets/pose/2d/human/studio-casual/torso.svg",
    hairSrc: "/assets/pose/2d/human/studio-casual/hair.svg",
  }),
  createStudioPoseAsset({
    id: "studio-hero",
    label: "Studio Hero Human",
    torsoSrc: "/assets/pose/2d/human/studio-hero/torso.svg",
    hairSrc: "/assets/pose/2d/human/studio-hero/hair.svg",
    accessorySrc: "/assets/pose/2d/human/studio-hero/accessory.svg",
  }),
  createStudioPoseAsset({
    id: "studio-neutral",
    label: "Studio Neutral Human",
    torsoSrc: "/assets/pose/2d/human/studio-neutral/torso.svg",
    hairSrc: "/assets/pose/2d/human/studio-neutral/hair.svg",
  }),
  {
    id: "builtin-cartoon",
    label: "Legacy Cartoon Human",
    style: "builtin-cartoon",
    format: "builtin",
    license: "Internal placeholder asset. Replace before production if needed.",
    sourceName: "Generated in project",
    attributionRequired: false,
    parts: [],
  },
  {
    id: "builtin-office",
    label: "Legacy Office Human",
    style: "builtin-cartoon",
    format: "builtin",
    license: "Internal placeholder asset. Replace before production if needed.",
    sourceName: "Generated in project",
    attributionRequired: false,
    parts: [],
  },
  {
    id: "builtin-casual",
    label: "Legacy Casual Human",
    style: "builtin-cartoon",
    format: "builtin",
    license: "Internal placeholder asset. Replace before production if needed.",
    sourceName: "Generated in project",
    attributionRequired: false,
    parts: [],
  },
  {
    id: "builtin-hero",
    label: "Legacy Hero Human",
    style: "builtin-cartoon",
    format: "builtin",
    license: "Internal placeholder asset. Replace before production if needed.",
    sourceName: "Generated in project",
    attributionRequired: false,
    parts: [],
  },
];

export function createDefaultHuman2DModelState(
  overrides?: Partial<Human2DModelState>,
): Human2DModelState {
  const base: Human2DModelState = {
    assetId: "studio-office",
    style: "custom",
    showCharacter: true,
    showSkeleton: false,
    showJointHandles: true,
    skinColor: "#E2B79B",
    clothColor: "#5B6EE1",
    hairColor: "#2C3340",
    accentColor: "#2F7E9E",
  };

  if (!overrides) {
    return base;
  }

  return {
    ...base,
    ...overrides,
    assetId:
      typeof overrides.assetId === "string" && overrides.assetId.trim().length > 0
        ? overrides.assetId
        : base.assetId,
    style: human2dStyleValues.has(overrides.style ?? base.style)
      ? (overrides.style ?? base.style)
      : base.style,
  };
}

export function normalizeHuman2DModelState(
  model?: Partial<Human2DModelState> | null,
  sharedDefaults?: Partial<Human2DModelState>,
) {
  const base = createDefaultHuman2DModelState(sharedDefaults);

  if (!model) {
    return base;
  }

  return createDefaultHuman2DModelState({
    ...base,
    ...model,
  });
}

export function getHuman2DAssetById(
  assetId: string,
  assets: Human2DCharacterAsset[],
) {
  return assets.find((asset) => asset.id === assetId) ?? null;
}

function dedupeAssets(assets: Human2DCharacterAsset[]) {
  const seen = new Set<string>();

  return assets.filter((asset) => {
    if (seen.has(asset.id)) {
      return false;
    }

    seen.add(asset.id);
    return true;
  });
}

type AssetCatalogResult = {
  assets: Human2DCharacterAsset[];
  warnings: string[];
};

type FetchLikeResponse = {
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
};

type FetchLike = (input: string) => Promise<FetchLikeResponse>;

async function fetchJson(input: string, fetcher: FetchLike) {
  const response = await fetcher(input);

  if (!response.ok) {
    const error = new Error(`Failed to load ${input} (${response.status})`);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return response.json();
}

export async function loadHuman2DAssetCatalog(
  fetcher: FetchLike = (input) => fetch(input) as Promise<FetchLikeResponse>,
): Promise<AssetCatalogResult> {
  const warnings: string[] = [];
  const assets = [...HUMAN_2D_CHARACTER_ASSETS];

  try {
    const manifest = (await fetchJson(
      HUMAN_2D_ASSET_MANIFEST_PATH,
      fetcher,
    )) as Human2DAssetManifest;
    const entries = Array.isArray(manifest.assets) ? manifest.assets : [];

    for (const entry of entries) {
      if (!entry || typeof entry.rig !== "string" || entry.rig.length === 0) {
        warnings.push("Skipped an invalid 2D human manifest entry.");
        continue;
      }

      try {
        const assetJson = await fetchJson(entry.rig, fetcher);
        const issues = validateHuman2DAsset(assetJson);

        if (issues.length > 0) {
          warnings.push(
            `Skipped ${entry.rig} because the rig definition is invalid.`,
          );
          continue;
        }

        assets.push(assetJson as Human2DCharacterAsset);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : `Failed to load ${entry.rig}`;

        warnings.push(message);
      }
    }
  } catch (error) {
    const status =
      error instanceof Error && "status" in error
        ? Number((error as Error & { status?: number }).status)
        : null;

    if (status !== 404) {
      warnings.push(
        error instanceof Error
          ? error.message
          : "Failed to load the 2D human asset manifest.",
      );
    }
  }

  return {
    assets: dedupeAssets(assets),
    warnings,
  };
}

export function useHuman2DAssetCatalog() {
  const [catalog, setCatalog] = useState<AssetCatalogResult>({
    assets: HUMAN_2D_CHARACTER_ASSETS,
    warnings: [],
  });

  useEffect(() => {
    let cancelled = false;

    void loadHuman2DAssetCatalog().then((result) => {
      if (!cancelled) {
        setCatalog(result);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return catalog;
}
