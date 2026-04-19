import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSampleTimelineState } from "@/lib/timeline/model";
import { TimelinePreview } from "./TimelinePreview";

const { ChronoMock } = vi.hoisted(() => ({
  ChronoMock: vi.fn(
    ({
      activeItemIndex,
      children,
      onItemSelected,
      style,
    }: {
      activeItemIndex: number;
      children: ReactNode;
      onItemSelected?: (payload: { index: number }) => void;
      style?: {
        classNames?: {
          card?: string;
          cardText?: string;
          title?: string;
        };
      };
    }) => (
      <div data-active-index={activeItemIndex} data-testid="chrono">
        <button type="button" onClick={() => onItemSelected?.({ index: 1 })}>
          select-second
        </button>
        <div className={style?.classNames?.title}>2026-04-24</div>
        <div className={style?.classNames?.card}>
          <div className={style?.classNames?.cardText}>{children}</div>
        </div>
      </div>
    ),
  ),
}));

vi.mock("next/dynamic", () => ({
  default: () => ChronoMock,
}));

describe("TimelinePreview", () => {
  afterEach(() => {
    ChronoMock.mockClear();
  });

  it("renders a single-layer card body with custom title styling hooks", () => {
    const state = createSampleTimelineState();
    const { container } = render(
      <TimelinePreview onSelectItem={vi.fn()} state={state} zoom={1.1} />,
    );

    const zoomStage = container.querySelector<HTMLElement>(".timeline-preview-zoom-stage");
    const chronoProps = ChronoMock.mock.calls[0]?.[0] as {
      content?: {
        compactText?: boolean;
      };
      display?: {
        scrollable?: boolean;
      };
      layout?: {
        cardHeight?: number | "auto";
        cardWidth?: number;
        lineWidth?: number;
      };
      style?: {
        classNames?: {
          card?: string;
          cardText?: string;
          title?: string;
        };
      };
    };

    expect(container.querySelector(".timeline-item-card")).toBeNull();
    expect(container.querySelectorAll(".timeline-item-content")).toHaveLength(state.items.length);
    expect(container.querySelector(".timeline-preview-card-text .timeline-item-content")).toBeInTheDocument();
    expect(container.querySelector(".timeline-preview-zoom-shell")).toBeInTheDocument();
    expect(zoomStage?.style.getPropertyValue("--timeline-preview-zoom")).toBe("1.1");
    expect(zoomStage?.style.getPropertyValue("--timeline-preview-zoom-inverse")).toBe(
      "0.9091",
    );
    expect(zoomStage?.style.transform).toBe("scale(1.1)");
    expect(zoomStage?.style.transformOrigin).toBe("top left");
    expect(chronoProps.content).toBeUndefined();
    expect(chronoProps.display?.scrollable).toBe(false);
    expect(chronoProps.layout?.cardHeight).toBe("auto");
    expect(chronoProps.layout?.cardWidth).toBe(680);
    expect(chronoProps.layout?.lineWidth).toBe(3);
    expect(container.querySelector(".timeline-preview-title")).toBeInTheDocument();
    expect(chronoProps.style?.classNames?.card).toBe("timeline-preview-card");
    expect(chronoProps.style?.classNames?.cardText).toBe("timeline-preview-card-text");
    expect(chronoProps.style?.classNames?.title).toBe("timeline-preview-title");
  });

  it("maps chrono selection back to the selected timeline item", () => {
    const state = createSampleTimelineState();
    const onSelectItem = vi.fn();

    render(<TimelinePreview onSelectItem={onSelectItem} state={state} />);
    fireEvent.click(screen.getByRole("button", { name: "select-second" }));

    expect(onSelectItem).toHaveBeenCalledWith(state.items[1]?.id);
  });
});
