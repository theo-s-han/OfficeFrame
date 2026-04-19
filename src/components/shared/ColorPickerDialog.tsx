"use client";

type ColorPickerOption = {
  description: string;
  label: string;
  value: string;
};

type ColorPickerDialogProps = {
  canApply: boolean;
  currentColor: string;
  draftColor: string;
  helpText: string;
  invalidMessage: string;
  options: ColorPickerOption[];
  title: string;
  onApply: () => void;
  onClose: () => void;
  onDraftColorChange: (value: string) => void;
};

export function ColorPickerDialog({
  canApply,
  currentColor,
  draftColor,
  helpText,
  invalidMessage,
  options,
  title,
  onApply,
  onClose,
  onDraftColorChange,
}: ColorPickerDialogProps) {
  return (
    <div
      className="color-picker-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="shared-color-picker-title"
        aria-modal="true"
        className="color-picker-dialog"
        role="dialog"
      >
        <header className="color-picker-header">
          <div>
            <div className="panel-kicker">색상</div>
            <h2 id="shared-color-picker-title">{title}</h2>
          </div>
          <button
            aria-label="색상 선택 닫기"
            className="modal-close-button"
            type="button"
            onClick={onClose}
          >
            닫기
          </button>
        </header>

        <p className="color-picker-help">{helpText}</p>

        <div className="color-picker-current">
          <span
            className="color-picker-current-swatch"
            style={{ backgroundColor: currentColor }}
          />
          <strong>{currentColor}</strong>
        </div>

        <div className="color-preset-grid" aria-label="색상 프리셋">
          {options.map((option) => (
            <button
              aria-label={`${option.label} ${option.value}`}
              aria-pressed={currentColor === option.value}
              className="color-preset-button"
              key={option.value}
              type="button"
              onClick={() => onDraftColorChange(option.value)}
            >
              <span
                className="color-swatch"
                style={{ backgroundColor: option.value }}
              />
              <span>
                <strong>{option.label}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="custom-color-controls">
          <label>
            <span>직접 선택</span>
            <input
              aria-label="사용자 지정 색상"
              type="color"
              value={currentColor}
              onChange={(event) => onDraftColorChange(event.target.value)}
            />
          </label>
          <label>
            <span>HEX</span>
            <input
              aria-label="HEX 색상 코드"
              maxLength={7}
              placeholder="#5B6EE1"
              value={draftColor}
              onChange={(event) => onDraftColorChange(event.target.value)}
            />
          </label>
        </div>

        {!canApply ? (
          <p className="field-error" role="alert">
            {invalidMessage}
          </p>
        ) : null}

        <footer className="color-picker-actions">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button
            className="primary-action"
            disabled={!canApply}
            type="button"
            onClick={onApply}
          >
            적용
          </button>
        </footer>
      </section>
    </div>
  );
}
