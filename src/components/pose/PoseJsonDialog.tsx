"use client";

type PoseJsonDialogProps = {
  errorMessage: string;
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function PoseJsonDialog({
  errorMessage,
  value,
  onChange,
  onClose,
  onSubmit,
}: PoseJsonDialogProps) {
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
        aria-labelledby="pose-json-dialog-title"
        aria-modal="true"
        className="pose-json-dialog"
        role="dialog"
      >
        <header className="color-picker-header">
          <div>
            <div className="panel-kicker">JSON</div>
            <h2 id="pose-json-dialog-title">Pose JSON 불러오기</h2>
          </div>
          <button className="modal-close-button" type="button" onClick={onClose}>
            닫기
          </button>
        </header>

        <p className="color-picker-help">
          현재 포즈 전체를 붙여넣으면 검증 후 상태를 복원합니다.
        </p>

        <label className="pose-json-dialog-editor">
          <span>CharacterPoseSpec JSON</span>
          <textarea
            aria-label="Pose JSON 입력"
            spellCheck={false}
            value={value}
            onChange={(event) => onChange(event.target.value)}
          />
        </label>

        {errorMessage ? (
          <p className="field-error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <footer className="color-picker-actions">
          <button type="button" onClick={onClose}>
            취소
          </button>
          <button className="primary-action" type="button" onClick={onSubmit}>
            적용
          </button>
        </footer>
      </section>
    </div>
  );
}
