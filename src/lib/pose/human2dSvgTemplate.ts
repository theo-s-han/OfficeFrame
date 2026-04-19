import type { Human2DModelState } from "./human2dRigTypes";

export type Human2DSvgTokenMap = Record<string, string>;

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

export function createHuman2DSvgTokenMap(
  model: Pick<
    Human2DModelState,
    "skinColor" | "clothColor" | "hairColor" | "accentColor"
  >,
): Human2DSvgTokenMap {
  return {
    "__ACCENT__": model.accentColor,
    "__ACCENT_DEEP__": shadeHexColor(model.accentColor, 0.22),
    "__ACCENT_LIGHT__": tintHexColor(model.accentColor, 0.36),
    "__CLOTH__": model.clothColor,
    "__CLOTH_DEEP__": shadeHexColor(model.clothColor, 0.32),
    "__CLOTH_LIGHT__": tintHexColor(model.clothColor, 0.22),
    "__CLOTH_SHADE__": shadeHexColor(model.clothColor, 0.18),
    "__HAIR__": model.hairColor,
    "__HAIR_SHADE__": shadeHexColor(model.hairColor, 0.18),
    "__SKIN__": model.skinColor,
    "__SKIN_LIGHT__": tintHexColor(model.skinColor, 0.26),
    "__SKIN_SHADE__": shadeHexColor(model.skinColor, 0.12),
  };
}

export function applyHuman2DSvgTokenMap(
  svgSource: string,
  tokenMap: Human2DSvgTokenMap,
) {
  return Object.entries(tokenMap).reduce((output, [token, color]) => {
    return output.split(token).join(color);
  }, svgSource);
}

export function createHuman2DSvgDataUrl(
  svgSource: string,
  tokenMap: Human2DSvgTokenMap,
) {
  const populatedSvg = applyHuman2DSvgTokenMap(svgSource, tokenMap);

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(populatedSvg)}`;
}
