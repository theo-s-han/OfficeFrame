"use client";

import { PoseExportButton } from "./PoseExportButton";
import { posePresetOptions, type PosePreset } from "@/lib/pose/poseSpec";

type PoseToolbarProps = {
  canExport: boolean;
  exportStatus: string;
  preset: PosePreset;
  onCopyJson: () => void;
  onExport: () => void;
  onImportJson: () => void;
  onMirror: () => void;
  onPresetChange: (preset: PosePreset) => void;
  onReset: () => void;
};

export function PoseToolbar({
  canExport,
  exportStatus,
  preset,
  onCopyJson,
  onExport,
  onImportJson,
  onMirror,
  onPresetChange,
  onReset,
}: PoseToolbarProps) {
  return (
    <>
      <div className="action-bar pose-toolbar" aria-label="캐릭터 포즈 메이커 toolbar">
        <label className="pose-toolbar-preset">
          <span>프리셋</span>
          <select
            aria-label="포즈 프리셋"
            value={preset}
            onChange={(event) => onPresetChange(event.target.value as PosePreset)}
          >
            {posePresetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onReset}>
          Reset
        </button>
        <button type="button" onClick={onMirror}>
          Mirror Left/Right
        </button>
        <button type="button" onClick={onCopyJson}>
          Pose JSON 복사
        </button>
        <button type="button" onClick={onImportJson}>
          Pose JSON 붙여넣기
        </button>
        <PoseExportButton disabled={!canExport} onClick={onExport} />
      </div>
      {exportStatus ? <p className="pose-toolbar-status">{exportStatus}</p> : null}
    </>
  );
}
