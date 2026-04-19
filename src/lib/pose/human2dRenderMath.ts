import type { Point2D } from "./poseSpec";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getAngleRadians(from: Point2D, to: Point2D) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function getDistance(from: Point2D, to: Point2D) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

export function radiansToDegrees(rad: number) {
  return (rad * 180) / Math.PI;
}

export function getSegmentTransform(args: {
  from: Point2D;
  to: Point2D;
  sourceHeight: number;
  pivot: Point2D;
}) {
  const distance = getDistance(args.from, args.to);
  const safeSourceHeight = args.sourceHeight <= 0 ? 1 : args.sourceHeight;
  const rotationDeg = radiansToDegrees(getAngleRadians(args.from, args.to)) - 90;
  const scaleY = clamp(distance / safeSourceHeight, 0.6, 1.6);

  return {
    x: args.from.x,
    y: args.from.y,
    rotationDeg,
    scaleY,
  };
}
