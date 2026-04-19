export type WbsTreeNodeLayout = {
  badgeHeight: number;
  badgeWidth: number;
  badgeX: number;
  badgeY: number;
  barHeight: number;
  cardHeight: number;
  cardWidth: number;
  codeY: number;
  contentX: number;
  contentY: number;
  kindY: number;
  noteLineCount: number;
  noteLineHeight: number;
  noteY: number | null;
  ownerLineCount: number;
  ownerLineHeight: number;
  ownerY: number | null;
  statusTextX: number;
  statusTextY: number;
  titleLineHeight: number;
  titleY: number;
};

export type WbsTreeExportPadding = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export type WbsTreeContentBounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

const contentInsetX = 16;
const topBarHeight = 8;
const rootCardWidth = 292;
const childCardWidth = 248;
const titleTop = 42;
const codeTop = 18;
const metaLineHeight = 16;
const noteLineHeight = 14;
const bodyGap = 8;
const ownerGap = 8;
const noteGap = 6;
const bottomPadding = 18;
const childCardMinHeight = 136;
const rootCardMinHeight = 118;

export const defaultWbsTreeNodeSize = {
  x: 340,
  y: 244,
};

export const defaultWbsTreeSeparation = {
  siblings: 1.15,
  nonSiblings: 1.3,
};

export const defaultWbsTreeZoom = 1;
export const defaultWbsTreeTranslateY = 96;

export const defaultWbsTreeExportPadding: WbsTreeExportPadding = {
  top: 0,
  right: 0,
  bottom: 24,
  left: 0,
};
export const defaultWbsTreeExportInsetRatio = 0.05;

function splitLongToken(token: string, maxLength: number): string[] {
  if (Array.from(token).length <= maxLength) {
    return [token];
  }

  const characters = Array.from(token);
  const chunks: string[] = [];

  for (let index = 0; index < characters.length; index += maxLength) {
    chunks.push(characters.slice(index, index + maxLength).join(""));
  }

  return chunks;
}

export function getWbsTextLineLimit(
  cardWidth: number,
  options?: {
    fontSize?: number;
    horizontalPadding?: number;
  },
) {
  const fontSize = options?.fontSize ?? 14;
  const horizontalPadding = options?.horizontalPadding ?? contentInsetX * 2;
  const usableWidth = Math.max(40, cardWidth - horizontalPadding);

  return Math.max(8, Math.floor(usableWidth / Math.max(10, fontSize * 1.1)));
}

export function splitWbsPreviewLines(value: string, maxLength: number): string[] {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (!normalized) {
    return [];
  }

  const tokens = normalized
    .split(" ")
    .flatMap((token) => splitLongToken(token, maxLength));
  const lines: string[] = [];
  let currentLine = "";

  tokens.forEach((token) => {
    const nextLine = currentLine ? `${currentLine} ${token}` : token;

    if (Array.from(nextLine).length <= maxLength) {
      currentLine = nextLine;
      return;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = token;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function getWbsTreeNodeLayout(options: {
  isRoot: boolean;
  noteLineCount?: number;
  ownerLineCount?: number;
  titleLineCount: number;
}): WbsTreeNodeLayout {
  const titleLineCount = Math.max(1, options.titleLineCount);
  const ownerLineCount = options.isRoot ? 0 : Math.max(0, options.ownerLineCount ?? 0);
  const noteLineCount = options.isRoot ? 0 : Math.max(0, options.noteLineCount ?? 0);
  const cardWidth = options.isRoot ? rootCardWidth : childCardWidth;
  const titleLineHeight = options.isRoot ? 20 : 18;
  const ownerLineHeight = metaLineHeight;

  let cursorY = titleTop + titleLineCount * titleLineHeight + bodyGap;
  const kindY = cursorY;

  cursorY += metaLineHeight;

  let ownerY: number | null = null;

  if (ownerLineCount > 0) {
    cursorY += ownerGap;
    ownerY = cursorY;
    cursorY += ownerLineCount * ownerLineHeight;
  }

  let noteY: number | null = null;

  if (noteLineCount > 0) {
    cursorY += noteGap;
    noteY = cursorY;
    cursorY += noteLineCount * noteLineHeight;
  }

  const cardHeight = Math.max(
    options.isRoot ? rootCardMinHeight : childCardMinHeight,
    cursorY + bottomPadding,
  );
  const badgeWidth = 74;
  const badgeHeight = 20;
  const badgeX = cardWidth - contentInsetX - badgeWidth;
  const badgeY = 18;

  return {
    badgeHeight,
    badgeWidth,
    badgeX,
    badgeY,
    barHeight: topBarHeight,
    cardHeight,
    cardWidth,
    codeY: codeTop,
    contentX: contentInsetX,
    contentY: codeTop,
    kindY,
    noteLineCount,
    noteLineHeight,
    noteY,
    ownerLineCount,
    ownerLineHeight,
    ownerY,
    statusTextX: badgeX + badgeWidth / 2,
    statusTextY: badgeY + badgeHeight / 2,
    titleLineHeight,
    titleY: titleTop,
  };
}

export function getWbsTreeNodeSize(maxCardHeight: number) {
  return {
    x: defaultWbsTreeNodeSize.x,
    y: Math.max(defaultWbsTreeNodeSize.y, Math.ceil(maxCardHeight + 112)),
  };
}

export function getWbsTreePreviewTransform(surfaceWidth: number) {
  return {
    x: surfaceWidth / 2,
    y: defaultWbsTreeTranslateY,
  };
}

export function getWbsTreeExportFrame(
  surfaceRect: Pick<DOMRect, "height" | "left" | "top" | "width">,
  svgRect: Pick<DOMRect, "height" | "left" | "top" | "width">,
  padding: WbsTreeExportPadding = defaultWbsTreeExportPadding,
) {
  return {
    height: Math.max(1, Math.ceil(surfaceRect.height + padding.top + padding.bottom)),
    svgHeight: svgRect.height,
    svgWidth: svgRect.width,
    svgX: Math.max(0, svgRect.left - surfaceRect.left) + padding.left,
    svgY: Math.max(0, svgRect.top - surfaceRect.top) + padding.top,
    trailingPadding: {
      bottom: padding.bottom,
      right: padding.right,
    },
    width: Math.max(1, Math.ceil(surfaceRect.width + padding.left + padding.right)),
  };
}

export function getWbsTreeContentExportFrame(
  bounds: WbsTreeContentBounds,
  padding: WbsTreeExportPadding = defaultWbsTreeExportPadding,
) {
  const insetX = Math.max(
    0,
    Math.ceil(bounds.width * defaultWbsTreeExportInsetRatio),
  );
  const insetY = Math.max(
    0,
    Math.ceil(bounds.height * defaultWbsTreeExportInsetRatio),
  );

  return {
    height: Math.max(
      1,
      Math.ceil(bounds.height + insetY * 2 + padding.top + padding.bottom),
    ),
    trailingPadding: {
      bottom: padding.bottom + insetY,
      right: padding.right + insetX,
    },
    transform: {
      scale: defaultWbsTreeZoom,
      x: padding.left + insetX - bounds.x * defaultWbsTreeZoom,
      y: padding.top + insetY - bounds.y * defaultWbsTreeZoom,
    },
    width: Math.max(
      1,
      Math.ceil(bounds.width + insetX * 2 + padding.left + padding.right),
    ),
  };
}
