import { createDefaultHuman2DModelState } from "./human2dAssets";
import {
  pose2dJointKeys,
  pose3dJointKeys,
  posePresetOptions,
  type CharacterPoseSpec,
  type Joint2D,
  type Joint3D,
  type PoseAppearance,
} from "./poseSpec";

export type PoseValidationIssue = {
  path: string;
  message: string;
};

const posePresetValues = new Set<string>(
  posePresetOptions.map((option) => option.value),
);
const poseModeValues = new Set(["2d", "3d"]);
const backgroundValues = new Set(["transparent", "white", "grid"]);
const bodyStyleValues = new Set(["neutral", "slim", "broad"]);
const human2dStyleValues = new Set([
  "builtin-cartoon",
  "open-peeps",
  "humaaans",
  "kenney",
  "custom",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidCssColor(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return false;
  }

  if (typeof document === "undefined") {
    return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim());
  }

  const option = document.createElement("option");

  option.style.color = "";
  option.style.color = value;

  return option.style.color !== "";
}

function validatePoint(
  issues: PoseValidationIssue[],
  path: string,
  value: unknown,
) {
  if (!isObject(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    issues.push({
      path,
      message: `${path} must contain numeric x/y coordinates.`,
    });
  }
}

function validateJointPointRecord(
  issues: PoseValidationIssue[],
  path: string,
  value: unknown,
  keys: Joint2D[],
) {
  if (!isObject(value)) {
    issues.push({
      path,
      message: `${path} must be a 2D joint map.`,
    });
    return;
  }

  keys.forEach((joint) => {
    validatePoint(issues, `${path}.${joint}`, value[joint]);
  });
}

function validateRotationRecord(
  issues: PoseValidationIssue[],
  path: string,
  value: unknown,
  keys: Joint3D[],
) {
  if (!isObject(value)) {
    issues.push({
      path,
      message: `${path} must be a 3D rotation map.`,
    });
    return;
  }

  keys.forEach((joint) => {
    const rotation = value[joint];

    if (
      !isObject(rotation) ||
      !isFiniteNumber(rotation.x) ||
      !isFiniteNumber(rotation.y) ||
      !isFiniteNumber(rotation.z)
    ) {
      issues.push({
        path: `${path}.${joint}`,
        message: `${path}.${joint} must contain numeric x/y/z rotation values.`,
      });
    }
  });
}

function validateHuman2DModel(
  issues: PoseValidationIssue[],
  path: string,
  value: unknown,
) {
  if (value === undefined) {
    return;
  }

  if (!isObject(value)) {
    issues.push({
      path,
      message: `${path} must be an object when provided.`,
    });
    return;
  }

  if (typeof value.assetId !== "string" || value.assetId.trim().length === 0) {
    issues.push({
      path: `${path}.assetId`,
      message: "human2dModel.assetId is required.",
    });
  }

  if (!human2dStyleValues.has(String(value.style))) {
    issues.push({
      path: `${path}.style`,
      message: "human2dModel.style is invalid.",
    });
  }

  ["showCharacter", "showSkeleton", "showJointHandles"].forEach((field) => {
    if (typeof value[field] !== "boolean") {
      issues.push({
        path: `${path}.${field}`,
        message: `${field} must be boolean.`,
      });
    }
  });

  ["skinColor", "clothColor", "hairColor", "accentColor"].forEach((field) => {
    if (!isValidCssColor(value[field])) {
      issues.push({
        path: `${path}.${field}`,
        message: `${field} must be a valid CSS color.`,
      });
    }
  });
}

export function validatePoseSpec(value: unknown): PoseValidationIssue[] {
  const issues: PoseValidationIssue[] = [];

  if (!isObject(value)) {
    return [
      {
        path: "root",
        message: "Pose data must be an object.",
      },
    ];
  }

  if (value.type !== "character-pose") {
    issues.push({
      path: "type",
      message: 'type must be "character-pose".',
    });
  }

  if (value.version !== 1) {
    issues.push({
      path: "version",
      message: "version must be 1.",
    });
  }

  if (!poseModeValues.has(String(value.mode))) {
    issues.push({
      path: "mode",
      message: "mode must be 2d or 3d.",
    });
  }

  if (!posePresetValues.has(String(value.preset))) {
    issues.push({
      path: "preset",
      message: "preset value is invalid.",
    });
  }

  if (!isObject(value.canvas)) {
    issues.push({
      path: "canvas",
      message: "canvas settings are required.",
    });
  } else {
    const canvas = value.canvas as Record<string, unknown>;
    const width = isFiniteNumber(canvas.width) ? canvas.width : null;
    const height = isFiniteNumber(canvas.height) ? canvas.height : null;
    const exportPixelRatio = isFiniteNumber(canvas.exportPixelRatio)
      ? canvas.exportPixelRatio
      : null;

    if (width === null || width < 300 || width > 2000) {
      issues.push({
        path: "canvas.width",
        message: "canvas width must be between 300 and 2000.",
      });
    }

    if (height === null || height < 300 || height > 2000) {
      issues.push({
        path: "canvas.height",
        message: "canvas height must be between 300 and 2000.",
      });
    }

    if (!backgroundValues.has(String(canvas.background))) {
      issues.push({
        path: "canvas.background",
        message: "canvas background is invalid.",
      });
    }

    if (
      exportPixelRatio === null ||
      exportPixelRatio < 1 ||
      exportPixelRatio > 4
    ) {
      issues.push({
        path: "canvas.exportPixelRatio",
        message: "exportPixelRatio must be between 1 and 4.",
      });
    }
  }

  if (!isObject(value.appearance)) {
    issues.push({
      path: "appearance",
      message: "appearance settings are required.",
    });
  } else {
    const appearance = value.appearance as Record<string, unknown>;
    const strokeWidth = isFiniteNumber(appearance.strokeWidth)
      ? appearance.strokeWidth
      : null;

    if (!bodyStyleValues.has(String(appearance.bodyStyle))) {
      issues.push({
        path: "appearance.bodyStyle",
        message: "bodyStyle is invalid.",
      });
    }

    ["skinColor", "clothColor", "accentColor"].forEach((field) => {
      if (!isValidCssColor(appearance[field])) {
        issues.push({
          path: `appearance.${field}`,
          message: `${field} must be a valid CSS color.`,
        });
      }
    });

    if (strokeWidth === null || strokeWidth < 1 || strokeWidth > 20) {
      issues.push({
        path: "appearance.strokeWidth",
        message: "strokeWidth must be between 1 and 20.",
      });
    }

    if (typeof appearance.showJointHandles !== "boolean") {
      issues.push({
        path: "appearance.showJointHandles",
        message: "showJointHandles must be boolean.",
      });
    }

    if (typeof appearance.showSkeleton !== "boolean") {
      issues.push({
        path: "appearance.showSkeleton",
        message: "showSkeleton must be boolean.",
      });
    }
  }

  validateJointPointRecord(issues, "pose2d", value.pose2d, pose2dJointKeys);
  validateRotationRecord(issues, "pose3d", value.pose3d, pose3dJointKeys);
  validateHuman2DModel(issues, "human2dModel", value.human2dModel);

  return issues;
}

function normalizeHuman2DModel(
  value: CharacterPoseSpec,
  appearance: PoseAppearance,
) {
  return createDefaultHuman2DModelState({
    skinColor: appearance.skinColor,
    clothColor: appearance.clothColor,
    accentColor: appearance.accentColor,
    showJointHandles: appearance.showJointHandles,
    showSkeleton: appearance.showSkeleton,
    ...value.human2dModel,
  });
}

export function normalizeCharacterPoseSpec(
  value: CharacterPoseSpec,
): CharacterPoseSpec {
  const appearance = { ...value.appearance };

  return {
    ...value,
    appearance,
    human2dModel: normalizeHuman2DModel(value, appearance),
  };
}

export function isCharacterPoseSpec(value: unknown): value is CharacterPoseSpec {
  return validatePoseSpec(value).length === 0;
}

export function parsePoseSpecJson(jsonText: string): {
  issues: PoseValidationIssue[];
  spec: CharacterPoseSpec | null;
} {
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    const issues = validatePoseSpec(parsed);

    return {
      issues,
      spec:
        issues.length === 0
          ? normalizeCharacterPoseSpec(parsed as CharacterPoseSpec)
          : null,
    };
  } catch (error) {
    return {
      issues: [
        {
          path: "json",
          message:
            error instanceof Error ? error.message : "Failed to parse JSON.",
        },
      ],
      spec: null,
    };
  }
}
