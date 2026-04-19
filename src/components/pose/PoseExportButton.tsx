"use client";

type PoseExportButtonProps = {
  disabled?: boolean;
  onClick: () => void;
};

export function PoseExportButton({
  disabled = false,
  onClick,
}: PoseExportButtonProps) {
  return (
    <button disabled={disabled} type="button" onClick={onClick}>
      이미지로 내보내기
    </button>
  );
}
