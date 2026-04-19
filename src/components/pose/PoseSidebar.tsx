"use client";

import { normalizeHuman2DModelState } from "@/lib/pose/human2dAssets";
import type { Human2DCharacterAsset } from "@/lib/pose/human2dRigTypes";
import type {
  CharacterPoseSpec,
  Joint2D,
  Joint3D,
  PoseAppearance,
  PoseCanvas,
} from "@/lib/pose/poseSpec";
import {
  canvasBackgroundOptions,
  pose2dJointOptions,
  pose3dJointOptions,
} from "@/lib/pose/poseSpec";
import { Human2DCharacterSelector } from "./Human2DCharacterSelector";

type PoseSidebarProps = {
  human2dAssets: Human2DCharacterAsset[];
  human2dAssetWarnings: string[];
  selectedJoint2d: Joint2D | null;
  selectedJoint3d: Joint3D | null;
  spec: CharacterPoseSpec;
  onAppearanceChange: (patch: Partial<PoseAppearance>) => void;
  onCanvasChange: (patch: Partial<PoseCanvas>) => void;
  onHuman2DModelChange: (
    patch: Partial<NonNullable<CharacterPoseSpec["human2dModel"]>>,
  ) => void;
  onJoint2dChange: (joint: Joint2D) => void;
  onJoint2dPointChange: (joint: Joint2D, axis: "x" | "y", value: number) => void;
  onJoint3dChange: (joint: Joint3D) => void;
  onJoint3dRotationChange: (
    joint: Joint3D,
    axis: "x" | "y" | "z",
    value: number,
  ) => void;
};

function SharedColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="pose-color-field">
      <span>{label}</span>
      <div className="pose-color-field-row">
        <input
          aria-label={`${label} color`}
          id={`${id}-picker`}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          aria-label={`${label} hex`}
          id={id}
          maxLength={7}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  );
}

export function PoseSidebar({
  human2dAssets,
  human2dAssetWarnings,
  selectedJoint2d,
  selectedJoint3d,
  spec,
  onAppearanceChange,
  onCanvasChange,
  onHuman2DModelChange,
  onJoint2dChange,
  onJoint2dPointChange,
  onJoint3dChange,
  onJoint3dRotationChange,
}: PoseSidebarProps) {
  const selectedPoint = selectedJoint2d ? spec.pose2d[selectedJoint2d] : null;
  const selectedRotation = selectedJoint3d ? spec.pose3d[selectedJoint3d] : null;
  const human2dModel = normalizeHuman2DModelState(spec.human2dModel, {
    accentColor: spec.appearance.accentColor,
    clothColor: spec.appearance.clothColor,
    showJointHandles: spec.appearance.showJointHandles,
    showSkeleton: spec.appearance.showSkeleton,
    skinColor: spec.appearance.skinColor,
  });

  return (
    <section
      className="diagram-edit-panel pose-sidebar"
      aria-labelledby="pose-sidebar-title"
    >
      <div className="panel-kicker">옵션</div>
      <h2 id="pose-sidebar-title">포즈 설정</h2>
      <p>
        캔버스, 캐릭터 스타일, 관절 좌표와 회전값을 조정해 preview와 PNG
        결과를 함께 맞춥니다.
      </p>

      <div className="diagram-section-heading">
        <h3>Canvas</h3>
      </div>

      <div className="diagram-meta-grid pose-meta-grid">
        <label>
          <span>Width</span>
          <input
            max={2000}
            min={300}
            type="number"
            value={spec.canvas.width}
            onChange={(event) =>
              onCanvasChange({
                width: Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          <span>Height</span>
          <input
            max={2000}
            min={300}
            type="number"
            value={spec.canvas.height}
            onChange={(event) =>
              onCanvasChange({
                height: Number(event.target.value),
              })
            }
          />
        </label>
        <label>
          <span>Background</span>
          <select
            value={spec.canvas.background}
            onChange={(event) =>
              onCanvasChange({
                background: event.target.value as PoseCanvas["background"],
              })
            }
          >
            {canvasBackgroundOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Export Pixel Ratio</span>
          <input
            max={4}
            min={1}
            step={0.5}
            type="number"
            value={spec.canvas.exportPixelRatio}
            onChange={(event) =>
              onCanvasChange({
                exportPixelRatio: Number(event.target.value),
              })
            }
          />
        </label>
      </div>

      <div className="diagram-section-heading top-spaced">
        <h3>Appearance</h3>
      </div>

      <div className="diagram-meta-grid pose-meta-grid">
        <label>
          <span>Body Style</span>
          <select
            value={spec.appearance.bodyStyle}
            onChange={(event) =>
              onAppearanceChange({
                bodyStyle: event.target.value as PoseAppearance["bodyStyle"],
              })
            }
          >
            <option value="neutral">Neutral</option>
            <option value="slim">Slim</option>
            <option value="broad">Broad</option>
          </select>
        </label>
        <label>
          <span>Stroke Width</span>
          <input
            max={20}
            min={1}
            type="number"
            value={spec.appearance.strokeWidth}
            onChange={(event) =>
              onAppearanceChange({
                strokeWidth: Number(event.target.value),
              })
            }
          />
        </label>
      </div>

      {spec.mode === "2d" ? (
        <>
          <div className="diagram-section-heading top-spaced">
            <h3>2D Character</h3>
          </div>
          <Human2DCharacterSelector
            assets={human2dAssets}
            model={human2dModel}
            warnings={human2dAssetWarnings}
            onChange={onHuman2DModelChange}
          />
        </>
      ) : (
        <>
          <div className="diagram-meta-grid pose-meta-grid">
            <label className="checkbox-field">
              <input
                checked={spec.appearance.showJointHandles}
                type="checkbox"
                onChange={(event) =>
                  onAppearanceChange({
                    showJointHandles: event.target.checked,
                  })
                }
              />
              <span>Show joint handles</span>
            </label>
            <label className="checkbox-field">
              <input
                checked={spec.appearance.showSkeleton}
                type="checkbox"
                onChange={(event) =>
                  onAppearanceChange({
                    showSkeleton: event.target.checked,
                  })
                }
              />
              <span>Show skeleton guide</span>
            </label>
          </div>

          <div className="pose-color-grid">
            <SharedColorField
              id="pose-skin-color"
              label="Skin"
              value={spec.appearance.skinColor}
              onChange={(value) => onAppearanceChange({ skinColor: value })}
            />
            <SharedColorField
              id="pose-cloth-color"
              label="Cloth"
              value={spec.appearance.clothColor}
              onChange={(value) => onAppearanceChange({ clothColor: value })}
            />
            <SharedColorField
              id="pose-accent-color"
              label="Accent"
              value={spec.appearance.accentColor}
              onChange={(value) => onAppearanceChange({ accentColor: value })}
            />
          </div>
        </>
      )}

      <div className="diagram-section-heading top-spaced">
        <h3>Selected Joint</h3>
      </div>

      {spec.mode === "2d" ? (
        <div className="pose-selected-joint-panel">
          <label>
            <span>Joint</span>
            <select
              value={selectedJoint2d ?? ""}
              onChange={(event) => onJoint2dChange(event.target.value as Joint2D)}
            >
              {pose2dJointOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="diagram-meta-grid pose-selected-grid">
            <label>
              <span>X</span>
              <input
                disabled={!selectedJoint2d || !selectedPoint}
                step={1}
                type="number"
                value={selectedPoint?.x ?? 0}
                onChange={(event) => {
                  if (selectedJoint2d) {
                    onJoint2dPointChange(
                      selectedJoint2d,
                      "x",
                      Number(event.target.value),
                    );
                  }
                }}
              />
            </label>
            <label>
              <span>Y</span>
              <input
                disabled={!selectedJoint2d || !selectedPoint}
                step={1}
                type="number"
                value={selectedPoint?.y ?? 0}
                onChange={(event) => {
                  if (selectedJoint2d) {
                    onJoint2dPointChange(
                      selectedJoint2d,
                      "y",
                      Number(event.target.value),
                    );
                  }
                }}
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="pose-selected-joint-panel">
          <label>
            <span>Joint</span>
            <select
              value={selectedJoint3d ?? ""}
              onChange={(event) => onJoint3dChange(event.target.value as Joint3D)}
            >
              {pose3dJointOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="diagram-meta-grid pose-selected-grid">
            {(["x", "y", "z"] as const).map((axis) => (
              <label key={axis}>
                <span>{axis.toUpperCase()}</span>
                <input
                  disabled={!selectedJoint3d || !selectedRotation}
                  step={0.05}
                  type="number"
                  value={selectedRotation?.[axis] ?? 0}
                  onChange={(event) => {
                    if (selectedJoint3d) {
                      onJoint3dRotationChange(
                        selectedJoint3d,
                        axis,
                        Number(event.target.value),
                      );
                    }
                  }}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
