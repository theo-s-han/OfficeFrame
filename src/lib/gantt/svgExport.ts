export function stabilizeSvgAnimations(root: ParentNode) {
  root.querySelectorAll("animate").forEach((animation) => {
    const parent = animation.parentElement;
    const attributeName = animation.getAttribute("attributeName");
    const targetValue = animation.getAttribute("to");

    if (parent && attributeName && targetValue) {
      parent.setAttribute(attributeName, targetValue);
    }

    animation.remove();
  });
}

const svgPresentationProperties = [
  "fill",
  "fill-opacity",
  "stroke",
  "stroke-opacity",
  "stroke-width",
  "stroke-dasharray",
  "stroke-linecap",
  "stroke-linejoin",
  "opacity",
  "filter",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-kerning",
  "font-synthesis",
  "letter-spacing",
  "paint-order",
  "shape-rendering",
  "text-anchor",
  "text-rendering",
  "dominant-baseline",
  "transform",
  "transform-origin",
  "transform-box",
  "white-space",
  "word-spacing",
  "display",
] as const;

export function inlineSvgPresentationStyles(
  sourceRoot: ParentNode,
  cloneRoot: ParentNode,
) {
  const sourceElements = Array.from(
    sourceRoot.querySelectorAll<SVGElement>("svg, svg *"),
  );
  const cloneElements = Array.from(
    cloneRoot.querySelectorAll<SVGElement>("svg, svg *"),
  );

  sourceElements.forEach((sourceElement, index) => {
    const cloneElement = cloneElements[index];

    if (!cloneElement) {
      return;
    }

    const computedStyle = window.getComputedStyle(sourceElement);

    svgPresentationProperties.forEach((propertyName) => {
      const propertyValue = computedStyle.getPropertyValue(propertyName);

      if (propertyValue) {
        cloneElement.style.setProperty(propertyName, propertyValue);
      }
    });
  });

  cloneRoot.querySelectorAll<SVGElement>(".grid-background").forEach((node) => {
    node.setAttribute("fill", "none");
    node.style.setProperty("fill", "none");
  });
}
