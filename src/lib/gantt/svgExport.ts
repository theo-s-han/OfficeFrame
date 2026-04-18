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
