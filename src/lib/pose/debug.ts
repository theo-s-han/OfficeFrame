const poseDebugStorageKey = "office-tool.pose.debug";

export function readPoseDebugEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(poseDebugStorageKey) === "true";
}

export function logPoseDebug(label: string, payload: unknown) {
  if (!readPoseDebugEnabled()) {
    return;
  }

  console.info(`[pose-debug] ${label}`, payload);
}
