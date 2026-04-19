export type TimelinePreviewVisualSize = {
  height: number;
  width: number;
};

export const TIMELINE_PREVIEW_VISUAL_SELECTOR = [
  ".timeline-preview-title",
  ".timeline-preview-card",
  ".chrono-card",
  ".timeline-item-content",
].join(", ");

function isVisibleTimelinePreviewNode(node: HTMLElement) {
  const style = window.getComputedStyle(node);

  if (style.display === "none" || style.visibility === "hidden") {
    return false;
  }

  const rect = node.getBoundingClientRect();

  return rect.width > 0 && rect.height > 0;
}

export function hasVisibleTimelinePreviewNodes(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(TIMELINE_PREVIEW_VISUAL_SELECTOR),
  ).some((node) => isVisibleTimelinePreviewNode(node));
}

function getElementVisualSize(element: HTMLElement): TimelinePreviewVisualSize {
  const rect = element.getBoundingClientRect();

  return {
    width: Math.max(
      1,
      Math.ceil(
        Math.max(
          rect.width,
          element.scrollWidth,
          element.offsetWidth,
          element.clientWidth,
          1,
        ),
      ),
    ),
    height: Math.max(
      1,
      Math.ceil(
        Math.max(
          rect.height,
          element.scrollHeight,
          element.offsetHeight,
          element.clientHeight,
          1,
        ),
      ),
    ),
  };
}

export function getTimelinePreviewVisualSize(
  root: HTMLElement,
): TimelinePreviewVisualSize {
  const baseSize = getElementVisualSize(root);
  const rootRect = root.getBoundingClientRect();
  const visibleNodes = Array.from(
    root.querySelectorAll<HTMLElement>(TIMELINE_PREVIEW_VISUAL_SELECTOR),
  ).filter((node) => isVisibleTimelinePreviewNode(node));

  if (visibleNodes.length === 0) {
    return baseSize;
  }

  let maxRight = 0;
  let maxBottom = 0;

  visibleNodes.forEach((node) => {
    const rect = node.getBoundingClientRect();

    maxRight = Math.max(maxRight, rect.right - rootRect.left);
    maxBottom = Math.max(maxBottom, rect.bottom - rootRect.top);
  });

  return {
    width: Math.max(1, Math.ceil(maxRight)),
    height: Math.max(1, Math.ceil(maxBottom)),
  };
}
