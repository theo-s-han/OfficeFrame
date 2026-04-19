import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TimelineEditorShell } from "./TimelineEditorShell";

vi.mock("./TimelinePreview", () => ({
  TimelinePreview: ({ zoom }: { zoom?: number }) => (
    <div data-testid="timeline-preview" data-zoom={zoom ?? 1} />
  ),
}));

describe("TimelineEditorShell", () => {
  it("adjusts preview zoom from the preview toolbar", () => {
    const { container } = render(<TimelineEditorShell />);
    const zoomButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>(".timeline-preview-toolbar button"),
    );
    const zoomOutButton = zoomButtons[0];
    const zoomInButton = zoomButtons[1];

    expect(zoomOutButton).toBeDefined();
    expect(zoomInButton).toBeDefined();
    expect(screen.getByTestId("timeline-preview")).toHaveAttribute("data-zoom", "0.8");

    fireEvent.click(zoomInButton!);
    expect(screen.getByTestId("timeline-preview")).toHaveAttribute("data-zoom", "0.9");

    fireEvent.click(zoomOutButton!);
    expect(screen.getByTestId("timeline-preview")).toHaveAttribute("data-zoom", "0.8");

    fireEvent.click(zoomOutButton!);
    fireEvent.click(zoomOutButton!);
    fireEvent.click(zoomOutButton!);
    fireEvent.click(zoomOutButton!);
    expect(screen.getByTestId("timeline-preview")).toHaveAttribute("data-zoom", "0.4");
    expect(zoomOutButton).toBeDisabled();
  });

  it("keeps timeline controls focused on user fields instead of internal meta fields", () => {
    render(<TimelineEditorShell />);

    expect(screen.queryByLabelText("타임라인명")).not.toBeInTheDocument();
    expect(screen.queryByText("보기 방식")).not.toBeInTheDocument();
  });
});
