"use client";

import { useEffect } from "react";
import { Image as KonvaImage } from "react-konva";
import { useLoadedImage } from "@/lib/pose/loadImage";
import type { Human2DSvgTokenMap } from "@/lib/pose/human2dSvgTemplate";

type Human2DPartImageProps = {
  height: number;
  offsetX: number;
  offsetY: number;
  opacity?: number;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
  src?: string;
  svgTokenMap?: Human2DSvgTokenMap | null;
  width: number;
  x: number;
  y: number;
  onStatusChange?: (
    status: "idle" | "loading" | "loaded" | "error",
    error: string,
  ) => void;
};

export function Human2DPartImage({
  height,
  offsetX,
  offsetY,
  opacity,
  rotation,
  scaleX,
  scaleY,
  src,
  svgTokenMap,
  width,
  x,
  y,
  onStatusChange,
}: Human2DPartImageProps) {
  const { error, image, status } = useLoadedImage(src, {
    svgTokenMap,
  });

  useEffect(() => {
    onStatusChange?.(status, error);
  }, [error, onStatusChange, status]);

  if (!image || status !== "loaded") {
    return null;
  }

  return (
    <KonvaImage
      height={height}
      image={image}
      offsetX={offsetX}
      offsetY={offsetY}
      opacity={opacity}
      rotation={rotation}
      scaleX={scaleX}
      scaleY={scaleY}
      width={width}
      x={x}
      y={y}
    />
  );
}
