"use client";

import { useMemo } from "react";
import type {
  Human2DCharacterAsset,
  Human2DModelState,
} from "@/lib/pose/human2dRigTypes";

type Human2DCharacterSelectorProps = {
  assets: Human2DCharacterAsset[];
  model: Human2DModelState;
  warnings?: string[];
  onChange: (patch: Partial<Human2DModelState>) => void;
};

type Human2DColorFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function Human2DColorField({
  id,
  label,
  value,
  onChange,
}: Human2DColorFieldProps) {
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

export function Human2DCharacterSelector({
  assets,
  model,
  warnings,
  onChange,
}: Human2DCharacterSelectorProps) {
  const currentAsset = assets.find((asset) => asset.id === model.assetId) ?? null;
  const assetOptions = useMemo(() => {
    if (currentAsset) {
      return assets;
    }

    return [
      ...assets,
      {
        id: model.assetId,
        label: `Missing asset (${model.assetId})`,
      } as Human2DCharacterAsset,
    ];
  }, [assets, currentAsset, model.assetId]);

  return (
    <div className="pose-human2d-selector">
      <div className="diagram-meta-grid pose-meta-grid">
        <label>
          <span>Character Asset</span>
          <select
            value={model.assetId}
            onChange={(event) => {
              const nextAsset =
                assets.find((asset) => asset.id === event.target.value) ?? null;

              onChange(
                nextAsset
                  ? {
                      assetId: nextAsset.id,
                      style: nextAsset.style,
                    }
                  : { assetId: event.target.value },
              );
            }}
          >
            {assetOptions.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.label}
              </option>
            ))}
          </select>
        </label>
        <label className="checkbox-field">
          <input
            checked={model.showCharacter}
            type="checkbox"
            onChange={(event) => onChange({ showCharacter: event.target.checked })}
          />
          <span>Show character</span>
        </label>
        <label className="checkbox-field">
          <input
            checked={model.showSkeleton}
            type="checkbox"
            onChange={(event) => onChange({ showSkeleton: event.target.checked })}
          />
          <span>Show skeleton</span>
        </label>
        <label className="checkbox-field">
          <input
            checked={model.showJointHandles}
            type="checkbox"
            onChange={(event) =>
              onChange({ showJointHandles: event.target.checked })
            }
          />
          <span>Show joint handles</span>
        </label>
      </div>

      <div className="pose-color-grid">
        <Human2DColorField
          id="pose-human2d-skin-color"
          label="Skin"
          value={model.skinColor}
          onChange={(value) => onChange({ skinColor: value })}
        />
        <Human2DColorField
          id="pose-human2d-cloth-color"
          label="Cloth"
          value={model.clothColor}
          onChange={(value) => onChange({ clothColor: value })}
        />
        <Human2DColorField
          id="pose-human2d-hair-color"
          label="Hair"
          value={model.hairColor}
          onChange={(value) => onChange({ hairColor: value })}
        />
        <Human2DColorField
          id="pose-human2d-accent-color"
          label="Accent"
          value={model.accentColor}
          onChange={(value) => onChange({ accentColor: value })}
        />
      </div>

      {currentAsset ? (
        <div className="pose-human2d-asset-meta">
          <strong>{currentAsset.label}</strong>
          <span>{currentAsset.sourceName}</span>
          <span>{currentAsset.license}</span>
        </div>
      ) : (
        <div className="pose-human2d-warning" role="alert">
          Selected asset is not available in the current catalog. Built-in fallback
          will be used in preview.
        </div>
      )}

      {warnings && warnings.length > 0 ? (
        <div className="pose-human2d-warning">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
