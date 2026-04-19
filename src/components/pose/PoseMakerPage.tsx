"use client";

import { useMemo, useState } from "react";
import {
  defaultPoseAppearance,
  defaultPoseCanvas,
  updatePose2DJoint,
  updatePose3DJointRotation,
} from "@/lib/pose/defaultPose";
import {
  normalizeHuman2DModelState,
  useHuman2DAssetCatalog,
} from "@/lib/pose/human2dAssets";
import type { Human2DModelState } from "@/lib/pose/human2dRigTypes";
import {
  exportPoseCanvasPng,
  exportPoseStagePng,
  getPoseExportFileName,
  type PoseStageExportHandle,
} from "@/lib/pose/exportPosePng";
import { mirrorCharacterPoseSpec } from "@/lib/pose/mirrorPose";
import { createPoseSpecFromPreset } from "@/lib/pose/presets";
import type {
  CharacterPoseSpec,
  Joint2D,
  Joint3D,
  PoseAppearance,
  PoseCanvas,
} from "@/lib/pose/poseSpec";
import {
  normalizeCharacterPoseSpec,
  parsePoseSpecJson,
  validatePoseSpec,
} from "@/lib/pose/validatePoseSpec";
import { downloadDataUrl } from "@/lib/shared/download";
import { Pose2DEditor } from "./Pose2DEditor";
import { Pose3DEditor } from "./Pose3DEditor";
import { PoseJsonDialog } from "./PoseJsonDialog";
import { PoseSidebar } from "./PoseSidebar";
import { PoseTabs } from "./PoseTabs";
import { PoseToolbar } from "./PoseToolbar";

const defaultSelectedJoint2d: Joint2D = "rightWrist";
const defaultSelectedJoint3d: Joint3D = "rightShoulder";

const initialSpec = createPoseSpecFromPreset("standing", {
  mode: "2d",
  overrides: {
    appearance: defaultPoseAppearance,
    canvas: defaultPoseCanvas,
  },
});

function clampCanvasPatch(patch: Partial<PoseCanvas>): Partial<PoseCanvas> {
  const nextPatch = { ...patch };

  if (typeof nextPatch.width === "number") {
    nextPatch.width = Math.min(2000, Math.max(300, Math.round(nextPatch.width)));
  }

  if (typeof nextPatch.height === "number") {
    nextPatch.height = Math.min(2000, Math.max(300, Math.round(nextPatch.height)));
  }

  if (typeof nextPatch.exportPixelRatio === "number") {
    nextPatch.exportPixelRatio = Math.min(
      4,
      Math.max(1, Number(nextPatch.exportPixelRatio.toFixed(2))),
    );
  }

  return nextPatch;
}

function clampAppearancePatch(
  patch: Partial<PoseAppearance>,
): Partial<PoseAppearance> {
  const nextPatch = { ...patch };

  if (typeof nextPatch.strokeWidth === "number") {
    nextPatch.strokeWidth = Math.min(
      20,
      Math.max(1, Math.round(nextPatch.strokeWidth)),
    );
  }

  return nextPatch;
}

function syncAppearanceFromHuman2DModel(
  appearance: PoseAppearance,
  patch: Partial<Human2DModelState>,
) {
  return {
    ...appearance,
    ...(patch.skinColor !== undefined ? { skinColor: patch.skinColor } : {}),
    ...(patch.clothColor !== undefined ? { clothColor: patch.clothColor } : {}),
    ...(patch.accentColor !== undefined ? { accentColor: patch.accentColor } : {}),
    ...(patch.showJointHandles !== undefined
      ? { showJointHandles: patch.showJointHandles }
      : {}),
    ...(patch.showSkeleton !== undefined
      ? { showSkeleton: patch.showSkeleton }
      : {}),
  };
}

function syncHuman2DFromAppearance(
  currentModel: CharacterPoseSpec["human2dModel"],
  appearance: PoseAppearance,
  patch: Partial<PoseAppearance>,
) {
  const nextModel = normalizeHuman2DModelState(currentModel, {
    skinColor: appearance.skinColor,
    clothColor: appearance.clothColor,
    accentColor: appearance.accentColor,
    showJointHandles: appearance.showJointHandles,
    showSkeleton: appearance.showSkeleton,
  });

  return {
    ...nextModel,
    ...(patch.skinColor !== undefined ? { skinColor: appearance.skinColor } : {}),
    ...(patch.clothColor !== undefined ? { clothColor: appearance.clothColor } : {}),
    ...(patch.accentColor !== undefined ? { accentColor: appearance.accentColor } : {}),
    ...(patch.showJointHandles !== undefined
      ? { showJointHandles: appearance.showJointHandles }
      : {}),
    ...(patch.showSkeleton !== undefined
      ? { showSkeleton: appearance.showSkeleton }
      : {}),
  };
}

export function PoseMakerPage() {
  const [spec, setSpec] = useState<CharacterPoseSpec>(
    normalizeCharacterPoseSpec(initialSpec),
  );
  const [selectedJoint2d, setSelectedJoint2d] = useState<Joint2D | null>(
    defaultSelectedJoint2d,
  );
  const [selectedJoint3d, setSelectedJoint3d] = useState<Joint3D | null>(
    defaultSelectedJoint3d,
  );
  const [exportStatus, setExportStatus] = useState("");
  const [isJsonDialogOpen, setIsJsonDialogOpen] = useState(false);
  const [jsonDraft, setJsonDraft] = useState(
    JSON.stringify(normalizeCharacterPoseSpec(initialSpec), null, 2),
  );
  const [jsonError, setJsonError] = useState("");
  const [stageHandle, setStageHandle] = useState<PoseStageExportHandle | null>(null);
  const [canvasHandle, setCanvasHandle] = useState<HTMLCanvasElement | null>(null);
  const { assets: human2dAssets, warnings: human2dAssetWarnings } =
    useHuman2DAssetCatalog();

  const issues = useMemo(() => validatePoseSpec(spec), [spec]);
  const canExport =
    issues.length === 0 &&
    ((spec.mode === "2d" && Boolean(stageHandle)) ||
      (spec.mode === "3d" && Boolean(canvasHandle)));

  function updateSpec(nextSpec: CharacterPoseSpec) {
    const normalized = normalizeCharacterPoseSpec(nextSpec);

    setSpec(normalized);
    setJsonDraft(JSON.stringify(normalized, null, 2));
  }

  function handleModeChange(mode: CharacterPoseSpec["mode"]) {
    updateSpec({
      ...spec,
      mode,
    });
    setExportStatus("");
  }

  function handlePresetChange(preset: CharacterPoseSpec["preset"]) {
    updateSpec(
      createPoseSpecFromPreset(preset, {
        mode: spec.mode,
        overrides: {
          appearance: spec.appearance,
          canvas: spec.canvas,
          human2dModel: spec.human2dModel,
        },
      }),
    );
    setExportStatus("");
  }

  function handleReset() {
    updateSpec(
      createPoseSpecFromPreset("standing", {
        mode: spec.mode,
        overrides: {
          appearance: spec.appearance,
          canvas: spec.canvas,
          human2dModel: spec.human2dModel,
        },
      }),
    );
    setSelectedJoint2d(defaultSelectedJoint2d);
    setSelectedJoint3d(defaultSelectedJoint3d);
    setExportStatus("");
  }

  function handleMirror() {
    updateSpec(mirrorCharacterPoseSpec(spec));
    setExportStatus("좌우 미러를 적용했습니다.");
  }

  async function handleCopyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
      setExportStatus("Pose JSON을 클립보드에 복사했습니다.");
    } catch {
      setExportStatus("클립보드 복사에 실패했습니다.");
    }
  }

  function handleImportJsonOpen() {
    setJsonDraft(JSON.stringify(spec, null, 2));
    setJsonError("");
    setIsJsonDialogOpen(true);
  }

  function handleImportJsonApply() {
    const result = parsePoseSpecJson(jsonDraft);

    if (!result.spec || result.issues.length > 0) {
      setJsonError(result.issues.map((issue) => issue.message).join(" "));
      return;
    }

    updateSpec(result.spec);
    setSelectedJoint2d(defaultSelectedJoint2d);
    setSelectedJoint3d(defaultSelectedJoint3d);
    setIsJsonDialogOpen(false);
    setJsonError("");
    setExportStatus("Pose JSON을 불러왔습니다.");
  }

  async function handleExport() {
    if (!canExport) {
      return;
    }

    try {
      const dataUrl =
        spec.mode === "2d" && stageHandle
          ? exportPoseStagePng(stageHandle, spec.canvas.exportPixelRatio)
          : spec.mode === "3d" && canvasHandle
            ? exportPoseCanvasPng(canvasHandle)
            : "";

      if (!dataUrl) {
        throw new Error("pose export returned an empty image");
      }

      downloadDataUrl(dataUrl, getPoseExportFileName());
      setExportStatus("character-pose.png 파일로 포즈 이미지를 내보냈습니다.");
    } catch (error) {
      setExportStatus(
        error instanceof Error
          ? `이미지 내보내기에 실패했습니다: ${error.message}`
          : "이미지 내보내기에 실패했습니다.",
      );
    }
  }

  function handleCanvasChange(patch: Partial<PoseCanvas>) {
    updateSpec({
      ...spec,
      canvas: {
        ...spec.canvas,
        ...clampCanvasPatch(patch),
      },
    });
  }

  function handleAppearanceChange(patch: Partial<PoseAppearance>) {
    const nextAppearance = {
      ...spec.appearance,
      ...clampAppearancePatch(patch),
    };

    updateSpec({
      ...spec,
      appearance: nextAppearance,
      human2dModel: syncHuman2DFromAppearance(
        spec.human2dModel,
        nextAppearance,
        patch,
      ),
    });
  }

  function handleHuman2DModelChange(
    patch: Partial<NonNullable<CharacterPoseSpec["human2dModel"]>>,
  ) {
    const nextHuman2DModel = normalizeHuman2DModelState(
      {
        ...spec.human2dModel,
        ...patch,
      },
      {
        accentColor: spec.appearance.accentColor,
        clothColor: spec.appearance.clothColor,
        showJointHandles: spec.appearance.showJointHandles,
        showSkeleton: spec.appearance.showSkeleton,
        skinColor: spec.appearance.skinColor,
      },
    );

    updateSpec({
      ...spec,
      appearance: syncAppearanceFromHuman2DModel(spec.appearance, patch),
      human2dModel: nextHuman2DModel,
    });
  }

  function handlePose2DChange(nextPose2d: CharacterPoseSpec["pose2d"]) {
    updateSpec({
      ...spec,
      pose2d: nextPose2d,
    });
  }

  function handlePose3DChange(nextPose3d: CharacterPoseSpec["pose3d"]) {
    updateSpec({
      ...spec,
      pose3d: nextPose3d,
    });
  }

  return (
    <section
      className="diagram-editor-shell pose-editor-shell"
      aria-label="캐릭터 포즈 메이커"
    >
      <PoseToolbar
        canExport={canExport}
        exportStatus={exportStatus}
        preset={spec.preset}
        onCopyJson={handleCopyJson}
        onExport={handleExport}
        onImportJson={handleImportJsonOpen}
        onMirror={handleMirror}
        onPresetChange={handlePresetChange}
        onReset={handleReset}
      />

      <div className="diagram-layout pose-layout">
        <PoseSidebar
          human2dAssets={human2dAssets}
          human2dAssetWarnings={human2dAssetWarnings}
          selectedJoint2d={selectedJoint2d}
          selectedJoint3d={selectedJoint3d}
          spec={spec}
          onAppearanceChange={handleAppearanceChange}
          onCanvasChange={handleCanvasChange}
          onHuman2DModelChange={handleHuman2DModelChange}
          onJoint2dChange={setSelectedJoint2d}
          onJoint2dPointChange={(joint, axis, value) =>
            handlePose2DChange(
              updatePose2DJoint(spec.pose2d, joint, {
                ...spec.pose2d[joint],
                [axis]: value,
              }),
            )
          }
          onJoint3dChange={setSelectedJoint3d}
          onJoint3dRotationChange={(joint, axis, value) =>
            handlePose3DChange(
              updatePose3DJointRotation(spec.pose3d, joint, {
                ...spec.pose3d[joint],
                [axis]: value,
              }),
            )
          }
        />

        <section
          className="diagram-preview-panel pose-preview-panel"
          aria-labelledby="pose-preview-title"
        >
          <div className="panel-kicker">Preview</div>
          <h2 id="pose-preview-title">캐릭터 포즈 미리보기</h2>
          <p>
            현재 포즈를 바로 조정하고 같은 preview 영역을 PNG로 내보냅니다.
          </p>

          {issues.length > 0 ? (
            <div className="validation-summary" role="alert">
              {issues.map((issue) => issue.message).join(" ")}
            </div>
          ) : null}

          <div className="pose-preview-surface">
            <PoseTabs mode={spec.mode} onModeChange={handleModeChange} />
            <div className="pose-preview-canvas-surface">
              {spec.mode === "2d" ? (
                <Pose2DEditor
                  human2dAssets={human2dAssets}
                  selectedJoint={selectedJoint2d}
                  spec={spec}
                  onPoseChange={handlePose2DChange}
                  onSelectJoint={setSelectedJoint2d}
                  onStageReady={setStageHandle}
                />
              ) : (
                <Pose3DEditor
                  selectedJoint={selectedJoint3d}
                  spec={spec}
                  onCanvasReady={setCanvasHandle}
                  onPoseChange={handlePose3DChange}
                  onSelectJoint={setSelectedJoint3d}
                />
              )}
            </div>
          </div>
        </section>
      </div>

      {isJsonDialogOpen ? (
        <PoseJsonDialog
          errorMessage={jsonError}
          value={jsonDraft}
          onChange={setJsonDraft}
          onClose={() => setIsJsonDialogOpen(false)}
          onSubmit={handleImportJsonApply}
        />
      ) : null}
    </section>
  );
}
