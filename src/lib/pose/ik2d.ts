import type { Point2D } from "./poseSpec";

const minimumDistanceEpsilon = 0.0001;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function add(left: Point2D, right: Point2D): Point2D {
  return {
    x: left.x + right.x,
    y: left.y + right.y,
  };
}

function subtract(left: Point2D, right: Point2D): Point2D {
  return {
    x: left.x - right.x,
    y: left.y - right.y,
  };
}

function scale(point: Point2D, scalar: number): Point2D {
  return {
    x: point.x * scalar,
    y: point.y * scalar,
  };
}

function length(point: Point2D) {
  return Math.hypot(point.x, point.y);
}

function normalize(point: Point2D): Point2D {
  const pointLength = length(point);

  if (pointLength <= minimumDistanceEpsilon) {
    return { x: 1, y: 0 };
  }

  return {
    x: point.x / pointLength,
    y: point.y / pointLength,
  };
}

function perpendicular(point: Point2D, bendDirection: 1 | -1): Point2D {
  return {
    x: -point.y * bendDirection,
    y: point.x * bendDirection,
  };
}

export function getPointDistance(left: Point2D, right: Point2D) {
  return length(subtract(left, right));
}

export function solveTwoBoneIK(
  root: Point2D,
  target: Point2D,
  upperLength: number,
  lowerLength: number,
  bendDirection: 1 | -1,
): {
  end: Point2D;
  mid: Point2D;
} {
  const toTarget = subtract(target, root);
  const distanceToTarget = length(toTarget);
  const safeDirection = normalize(toTarget);
  const minimumReach = Math.max(
    Math.abs(upperLength - lowerLength) + minimumDistanceEpsilon,
    minimumDistanceEpsilon,
  );
  const maximumReach = Math.max(
    minimumReach,
    upperLength + lowerLength - minimumDistanceEpsilon,
  );
  const clampedDistance = clamp(distanceToTarget, minimumReach, maximumReach);
  const end = add(root, scale(safeDirection, clampedDistance));
  const shoulderToMidDistance =
    (upperLength * upperLength -
      lowerLength * lowerLength +
      clampedDistance * clampedDistance) /
    (2 * clampedDistance);
  const height = Math.sqrt(
    Math.max(upperLength * upperLength - shoulderToMidDistance * shoulderToMidDistance, 0),
  );
  const basePoint = add(root, scale(safeDirection, shoulderToMidDistance));
  const bendVector = scale(perpendicular(safeDirection, bendDirection), height);

  return {
    end,
    mid: add(basePoint, bendVector),
  };
}

export function projectMidpointToTwoBoneChain(
  root: Point2D,
  end: Point2D,
  proposedMid: Point2D,
  upperLength: number,
  lowerLength: number,
  preferredBendDirection?: 1 | -1,
): Point2D {
  const rootToEnd = subtract(end, root);
  const rootToEndDistance = length(rootToEnd);
  const safeDirection = normalize(rootToEnd);
  const minimumReach = Math.max(
    Math.abs(upperLength - lowerLength) + minimumDistanceEpsilon,
    minimumDistanceEpsilon,
  );
  const maximumReach = Math.max(
    minimumReach,
    upperLength + lowerLength - minimumDistanceEpsilon,
  );
  const clampedDistance = clamp(rootToEndDistance, minimumReach, maximumReach);
  const adjustedEnd = add(root, scale(safeDirection, clampedDistance));
  const rootToAdjustedEnd = subtract(adjustedEnd, root);
  const adjustedDirection = normalize(rootToAdjustedEnd);
  const shoulderToMidDistance =
    (upperLength * upperLength -
      lowerLength * lowerLength +
      clampedDistance * clampedDistance) /
    (2 * clampedDistance);
  const height = Math.sqrt(
    Math.max(upperLength * upperLength - shoulderToMidDistance * shoulderToMidDistance, 0),
  );
  const basePoint = add(root, scale(adjustedDirection, shoulderToMidDistance));
  const normal = perpendicular(adjustedDirection, 1);
  const firstCandidate = add(basePoint, scale(normal, height));
  const secondCandidate = add(basePoint, scale(normal, -height));
  const firstDistance = getPointDistance(firstCandidate, proposedMid);
  const secondDistance = getPointDistance(secondCandidate, proposedMid);

  if (preferredBendDirection) {
    const preferredCandidate =
      preferredBendDirection === 1 ? firstCandidate : secondCandidate;
    const fallbackCandidate =
      preferredBendDirection === 1 ? secondCandidate : firstCandidate;
    const preferredDistance = getPointDistance(preferredCandidate, proposedMid);
    const fallbackDistance = getPointDistance(fallbackCandidate, proposedMid);

    if (preferredDistance <= fallbackDistance + 8) {
      return preferredCandidate;
    }
  }

  return firstDistance <= secondDistance ? firstCandidate : secondCandidate;
}
