"use client";

import type { PoseMode } from "@/lib/pose/poseSpec";

type PoseTabsProps = {
  mode: PoseMode;
  onModeChange: (mode: PoseMode) => void;
};

export function PoseTabs({ mode, onModeChange }: PoseTabsProps) {
  return (
    <div className="pose-tabs" role="tablist" aria-label="포즈 미리보기 탭">
      {(["2d", "3d"] as const).map((candidateMode) => (
        <button
          aria-selected={mode === candidateMode}
          className={mode === candidateMode ? "active" : undefined}
          key={candidateMode}
          role="tab"
          type="button"
          onClick={() => onModeChange(candidateMode)}
        >
          {candidateMode === "2d" ? "2D" : "3D"}
        </button>
      ))}
    </div>
  );
}
