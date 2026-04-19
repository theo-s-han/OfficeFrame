import { useEffect, useMemo, useState } from "react";
import type { Human2DSvgTokenMap } from "./human2dSvgTemplate";
import { createHuman2DSvgDataUrl } from "./human2dSvgTemplate";

export type LoadedImageState = {
  error: string;
  image: HTMLImageElement | null;
  status: "idle" | "loading" | "loaded" | "error";
};

type ResolvedImageState = {
  error: string;
  image: HTMLImageElement | null;
  cacheKey: string | null;
};

function isAllowedLocalAssetPath(src: string) {
  if (src.startsWith("data:image/")) {
    return true;
  }

  if (typeof window === "undefined") {
    return src.startsWith("/assets/");
  }

  try {
    const url = new URL(src, window.location.origin);

    return url.origin === window.location.origin && url.pathname.startsWith("/assets/");
  } catch {
    return false;
  }
}

function isSvgAssetPath(src: string) {
  if (src.startsWith("data:image/svg+xml")) {
    return true;
  }

  if (typeof window === "undefined") {
    return src.toLowerCase().endsWith(".svg");
  }

  try {
    const url = new URL(src, window.location.origin);
    return url.pathname.toLowerCase().endsWith(".svg");
  } catch {
    return src.toLowerCase().endsWith(".svg");
  }
}

const svgImageCache = new Map<string, string>();

type UseLoadedImageOptions = {
  svgTokenMap?: Human2DSvgTokenMap | null;
};

export function useLoadedImage(
  src?: string | null,
  options?: UseLoadedImageOptions,
): LoadedImageState {
  const tokenEntries = useMemo(
    () =>
      Object.entries(options?.svgTokenMap ?? {}).sort((left, right) =>
        left[0].localeCompare(right[0]),
      ),
    [options?.svgTokenMap],
  );
  const svgTokenMap = useMemo(
    () => Object.fromEntries(tokenEntries),
    [tokenEntries],
  );
  const tokenKey = tokenEntries
    .map(([token, color]) => `${token}:${color}`)
    .join("|");
  const cacheKey = src ? `${src}::${tokenKey}` : null;
  const [resolvedState, setResolvedState] = useState<ResolvedImageState>({
    error: "",
    image: null,
    cacheKey: null,
  });
  const isAllowed =
    typeof src === "string" &&
    src.length > 0 &&
    isAllowedLocalAssetPath(src);

  useEffect(() => {
    if (!src || !isAllowed) {
      return;
    }

    let cancelled = false;
    const image = new window.Image();

    const resolveSource = async () => {
      const shouldPopulateSvg =
        isSvgAssetPath(src) && tokenEntries.length > 0 && !src.startsWith("data:image/");

      if (!shouldPopulateSvg) {
        return src;
      }

      if (cacheKey && svgImageCache.has(cacheKey)) {
        return svgImageCache.get(cacheKey) ?? src;
      }

      const response = await window.fetch(src);

      if (!response.ok) {
        throw new Error(`Failed to load image template: ${src}`);
      }

      const svgTemplate = await response.text();
      const resolvedSrc = createHuman2DSvgDataUrl(
        svgTemplate,
        svgTokenMap,
      );

      if (cacheKey) {
        svgImageCache.set(cacheKey, resolvedSrc);
      }

      return resolvedSrc;
    };

    void resolveSource()
      .then((resolvedSrc) => {
        image.onload = () => {
          if (cancelled) {
            return;
          }

          setResolvedState({
            error: "",
            image,
            cacheKey,
          });
        };

        image.onerror = () => {
          if (cancelled) {
            return;
          }

          setResolvedState({
            error: `Failed to load image: ${src}`,
            image: null,
            cacheKey,
          });
        };

        image.src = resolvedSrc;
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setResolvedState({
          error:
            error instanceof Error
              ? error.message
              : `Failed to load image: ${src}`,
          image: null,
          cacheKey,
        });
      });

    return () => {
      cancelled = true;
      image.onload = null;
      image.onerror = null;
    };
  }, [cacheKey, isAllowed, src, svgTokenMap, tokenEntries, tokenKey]);

  if (!src) {
    return {
      error: "",
      image: null,
      status: "idle",
    };
  }

  if (!isAllowed) {
    return {
      error: "Only same-origin /assets/... image paths are allowed.",
      image: null,
      status: "error",
    };
  }

  if (resolvedState.cacheKey !== cacheKey) {
    return {
      error: "",
      image: null,
      status: "loading",
    };
  }

  if (!resolvedState.image) {
    return {
      error: resolvedState.error,
      image: null,
      status: "error",
    };
  }

  return {
    error: "",
    image: resolvedState.image,
    status: "loaded",
  };
}
