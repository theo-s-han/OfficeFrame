import type {
  Human2DCharacterAsset,
  Human2DPartDefinition,
} from "./human2dRigTypes";

export type Human2DAssetValidationIssue = {
  path: string;
  message: string;
};

const formatValues = new Set(["builtin", "segmented-svg", "segmented-png"]);
const styleValues = new Set([
  "builtin-cartoon",
  "open-peeps",
  "humaaans",
  "kenney",
  "custom",
]);
const renderModeValues = new Set(["anchored", "between-joints"]);
const tintRoleValues = new Set(["skin", "cloth", "hair", "accent", "none"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isLocalAssetPath(src: string) {
  return src.startsWith("/assets/");
}

function validatePart(
  issues: Human2DAssetValidationIssue[],
  path: string,
  part: Human2DPartDefinition,
) {
  if (!part.id) {
    issues.push({
      path: `${path}.id`,
      message: "part id is required",
    });
  }

  if (!renderModeValues.has(part.renderMode)) {
    issues.push({
      path: `${path}.renderMode`,
      message: "renderMode must be anchored or between-joints",
    });
  }

  if (!isFiniteNumber(part.width) || part.width <= 0) {
    issues.push({
      path: `${path}.width`,
      message: "part width must be a positive number",
    });
  }

  if (!isFiniteNumber(part.height) || part.height <= 0) {
    issues.push({
      path: `${path}.height`,
      message: "part height must be a positive number",
    });
  }

  if (
    !isObject(part.pivot) ||
    !isFiniteNumber(part.pivot.x) ||
    !isFiniteNumber(part.pivot.y)
  ) {
    issues.push({
      path: `${path}.pivot`,
      message: "part pivot must contain numeric x/y",
    });
  }

  if (!isFiniteNumber(part.zIndex)) {
    issues.push({
      path: `${path}.zIndex`,
      message: "part zIndex must be numeric",
    });
  }

  if (part.src && !isLocalAssetPath(part.src)) {
    issues.push({
      path: `${path}.src`,
      message: "part src must be a same-origin /assets/... path",
    });
  }

  if (part.renderMode === "between-joints") {
    if (!part.fromJoint || !part.toJoint) {
      issues.push({
        path,
        message: "between-joints part requires fromJoint and toJoint",
      });
    }
  }

  if (part.renderMode === "anchored" && !part.anchorJoint) {
    issues.push({
      path,
      message: "anchored part requires anchorJoint",
    });
  }

  if (part.tintRole && !tintRoleValues.has(part.tintRole)) {
    issues.push({
      path: `${path}.tintRole`,
      message: "tintRole is invalid",
    });
  }
}

export function validateHuman2DAsset(
  value: unknown,
): Human2DAssetValidationIssue[] {
  const issues: Human2DAssetValidationIssue[] = [];

  if (!isObject(value)) {
    return [
      {
        path: "asset",
        message: "asset must be an object",
      },
    ];
  }

  const asset = value as Human2DCharacterAsset;

  if (typeof asset.id !== "string" || asset.id.trim().length === 0) {
    issues.push({
      path: "asset.id",
      message: "asset id is required",
    });
  }

  if (typeof asset.label !== "string" || asset.label.trim().length === 0) {
    issues.push({
      path: "asset.label",
      message: "asset label is required",
    });
  }

  if (!styleValues.has(String(asset.style))) {
    issues.push({
      path: "asset.style",
      message: "asset style is invalid",
    });
  }

  if (!formatValues.has(String(asset.format))) {
    issues.push({
      path: "asset.format",
      message: "asset format is invalid",
    });
  }

  if (typeof asset.license !== "string" || asset.license.trim().length === 0) {
    issues.push({
      path: "asset.license",
      message: "asset license is required",
    });
  }

  if (
    typeof asset.sourceName !== "string" ||
    asset.sourceName.trim().length === 0
  ) {
    issues.push({
      path: "asset.sourceName",
      message: "asset sourceName is required",
    });
  }

  if (typeof asset.attributionRequired !== "boolean") {
    issues.push({
      path: "asset.attributionRequired",
      message: "asset attributionRequired must be boolean",
    });
  }

  if (!Array.isArray(asset.parts)) {
    issues.push({
      path: "asset.parts",
      message: "asset parts must be an array",
    });
    return issues;
  }

  const partIds = new Set<string>();

  asset.parts.forEach((part, index) => {
    validatePart(issues, `asset.parts[${index}]`, part);

    if (partIds.has(part.id)) {
      issues.push({
        path: `asset.parts[${index}].id`,
        message: "part id must be unique",
      });
    }

    partIds.add(part.id);
  });

  return issues;
}
