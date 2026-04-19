import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  defaultPoseAppearance,
  defaultPoseCanvas,
} from "@/lib/pose/defaultPose";
import { mirrorCharacterPoseSpec } from "@/lib/pose/mirrorPose";
import { createPoseSpecFromPreset } from "@/lib/pose/presets";
import type { CharacterPoseSpec } from "@/lib/pose/poseSpec";
import { PoseMakerPage } from "./PoseMakerPage";

const stageHandle = vi.hoisted(() => ({
  toDataURL: vi.fn(() => "data:image/png;base64,stage"),
}));

const canvasHandle = vi.hoisted(
  () =>
    ({
      toDataURL: vi.fn(() => "data:image/png;base64,canvas"),
    }) as unknown as HTMLCanvasElement,
);

const exportPoseStagePngMock = vi.hoisted(() =>
  vi.fn(() => "data:image/png;base64,stage-export"),
);
const exportPoseCanvasPngMock = vi.hoisted(() =>
  vi.fn(() => "data:image/png;base64,canvas-export"),
);
const downloadDataUrlMock = vi.hoisted(() => vi.fn());
const writeTextMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/pose/human2dAssets", async () => {
  const actual = await vi.importActual<typeof import("@/lib/pose/human2dAssets")>(
    "@/lib/pose/human2dAssets",
  );

  return {
    ...actual,
    useHuman2DAssetCatalog: () => ({
      assets: actual.HUMAN_2D_CHARACTER_ASSETS,
      warnings: [],
    }),
  };
});

vi.mock("@/lib/pose/exportPosePng", () => ({
  exportPoseStagePng: exportPoseStagePngMock,
  exportPoseCanvasPng: exportPoseCanvasPngMock,
  getPoseExportFileName: () => "character-pose.png",
}));

vi.mock("@/lib/shared/download", () => ({
  downloadDataUrl: downloadDataUrlMock,
}));

vi.mock("./Pose2DEditor", async () => {
  const React = await import("react");

  return {
    Pose2DEditor: ({
      onStageReady,
      selectedJoint,
    }: {
      onStageReady: (stage: typeof stageHandle | null) => void;
      selectedJoint: string | null;
    }) => {
      React.useEffect(() => {
        onStageReady(stageHandle);

        return () => {
          onStageReady(null);
        };
      }, [onStageReady]);

      return React.createElement("div", {
        "data-selected-joint": selectedJoint ?? "",
        "data-testid": "pose-2d-editor",
      });
    },
  };
});

vi.mock("./Pose3DEditor", async () => {
  const React = await import("react");

  return {
    Pose3DEditor: ({
      onCanvasReady,
      selectedJoint,
    }: {
      onCanvasReady: (canvas: HTMLCanvasElement | null) => void;
      selectedJoint: string | null;
    }) => {
      React.useEffect(() => {
        onCanvasReady(canvasHandle);

        return () => {
          onCanvasReady(null);
        };
      }, [onCanvasReady]);

      return React.createElement("div", {
        "data-selected-joint": selectedJoint ?? "",
        "data-testid": "pose-3d-editor",
      });
    },
  };
});

function getToolbarButtons(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(".pose-toolbar button"),
  );
}

function getPresetSelect(container: HTMLElement) {
  const presetSelect = container.querySelector<HTMLSelectElement>(
    ".pose-toolbar select",
  );

  if (!presetSelect) {
    throw new Error("preset select not found");
  }

  return presetSelect;
}

function getImportDialog(container: HTMLElement) {
  const dialog = container.querySelector<HTMLElement>(".pose-json-dialog");

  if (!dialog) {
    throw new Error("pose JSON dialog not found");
  }

  return dialog;
}

function createImportedSpec(): CharacterPoseSpec {
  return createPoseSpecFromPreset("walking", {
    mode: "3d",
    overrides: {
      appearance: {
        ...defaultPoseAppearance,
        clothColor: "#A65D7B",
      },
      canvas: {
        ...defaultPoseCanvas,
        width: 1200,
        height: 840,
        background: "white",
        exportPixelRatio: 3,
      },
    },
  });
}

beforeEach(() => {
  Object.defineProperty(globalThis.navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: writeTextMock,
    },
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("PoseMakerPage", () => {
  it("renders the 2D editor by default and switches to the 3D editor", async () => {
    const { container } = render(<PoseMakerPage />);
    const assetSelect = screen.getByLabelText("Character Asset");

    expect(screen.getByTestId("pose-2d-editor")).toBeInTheDocument();
    expect(assetSelect).toHaveValue("studio-office");
    expect(
      within(assetSelect).getByRole("option", { name: "Studio Office Human" }),
    ).toBeInTheDocument();
    expect(
      within(assetSelect).getByRole("option", { name: "Studio Casual Human" }),
    ).toBeInTheDocument();
    expect(
      within(assetSelect).getByRole("option", { name: "Studio Hero Human" }),
    ).toBeInTheDocument();
    expect(
      within(assetSelect).getByRole("option", { name: "Studio Neutral Human" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("pose-3d-editor")).not.toBeInTheDocument();
    expect(getToolbarButtons(container)[4]).toBeEnabled();

    fireEvent.click(screen.getByRole("tab", { name: "3D" }));

    await waitFor(() => {
      expect(screen.getByTestId("pose-3d-editor")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("pose-2d-editor")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Joint")).toHaveValue("rightShoulder");
  });

  it("updates the preset, mirrors it, and resets back to standing", () => {
    const { container } = render(<PoseMakerPage />);
    const presetSelect = getPresetSelect(container);
    const xInput = screen.getByLabelText("X");

    const pointingRightSpec = createPoseSpecFromPreset("pointing-right", {
      mode: "2d",
      overrides: {
        appearance: defaultPoseAppearance,
        canvas: defaultPoseCanvas,
      },
    });
    const mirroredSpec = mirrorCharacterPoseSpec(pointingRightSpec);
    const standingSpec = createPoseSpecFromPreset("standing", {
      mode: "2d",
      overrides: {
        appearance: defaultPoseAppearance,
        canvas: defaultPoseCanvas,
      },
    });

    fireEvent.change(presetSelect, { target: { value: "pointing-right" } });
    expect(xInput).toHaveValue(pointingRightSpec.pose2d.rightWrist.x);

    fireEvent.click(getToolbarButtons(container)[1]);
    expect(xInput).toHaveValue(mirroredSpec.pose2d.rightWrist.x);

    fireEvent.click(getToolbarButtons(container)[0]);
    expect(xInput).toHaveValue(standingSpec.pose2d.rightWrist.x);
  });

  it("copies the current pose JSON to the clipboard", async () => {
    const { container } = render(<PoseMakerPage />);

    fireEvent.click(getToolbarButtons(container)[2]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });

    expect(writeTextMock.mock.calls[0]?.[0]).toContain('"type": "character-pose"');
    expect(writeTextMock.mock.calls[0]?.[0]).toContain('"preset": "standing"');
    expect(writeTextMock.mock.calls[0]?.[0]).toContain('"human2dModel"');
  });

  it("imports a valid pose JSON payload and restores the new state", async () => {
    const { container } = render(<PoseMakerPage />);
    const importedSpec = createImportedSpec();

    fireEvent.click(getToolbarButtons(container)[3]);

    const dialog = getImportDialog(container);
    const textarea = screen.getByLabelText(/CharacterPoseSpec JSON/i);
    const applyButton = dialog.querySelector<HTMLButtonElement>("button.primary-action");

    if (!applyButton) {
      throw new Error("apply button not found");
    }

    fireEvent.change(textarea, {
      target: { value: JSON.stringify(importedSpec, null, 2) },
    });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByTestId("pose-3d-editor")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("Width")).toHaveValue(1200);
    expect(screen.getByLabelText("Height")).toHaveValue(840);
    expect(screen.getByLabelText("Export Pixel Ratio")).toHaveValue(3);
    expect(screen.getByRole("tab", { name: "3D" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("keeps the import dialog open and shows an error for invalid JSON", async () => {
    const { container } = render(<PoseMakerPage />);

    fireEvent.click(getToolbarButtons(container)[3]);

    const dialog = getImportDialog(container);
    const textarea = dialog.querySelector<HTMLTextAreaElement>("textarea");
    const applyButton = dialog.querySelector<HTMLButtonElement>("button.primary-action");

    if (!textarea || !applyButton) {
      throw new Error("import dialog controls not found");
    }

    fireEvent.change(textarea, {
      target: { value: '{"type":"wrong"}' },
    });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(container.querySelector(".pose-json-dialog")).toBeTruthy();
    expect(screen.queryByTestId("pose-3d-editor")).not.toBeInTheDocument();
  });

  it("exports the active 2D and 3D previews through the correct adapters", async () => {
    const { container } = render(<PoseMakerPage />);
    const exportButton = getToolbarButtons(container)[4];

    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(exportPoseStagePngMock).toHaveBeenCalledWith(stageHandle, 2);
    });

    expect(exportPoseCanvasPngMock).not.toHaveBeenCalled();
    expect(downloadDataUrlMock).toHaveBeenCalledWith(
      "data:image/png;base64,stage-export",
      "character-pose.png",
    );

    fireEvent.click(screen.getByRole("tab", { name: "3D" }));

    await waitFor(() => {
      expect(screen.getByTestId("pose-3d-editor")).toBeInTheDocument();
    });

    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(exportPoseCanvasPngMock).toHaveBeenCalledWith(canvasHandle);
    });
  });
});
