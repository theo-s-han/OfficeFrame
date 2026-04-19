"use client";

import dynamic from "next/dynamic";
import { useMemo, type CSSProperties } from "react";
import type { TimelineItem } from "react-chrono";
import {
  getSortedValidTimelineItems,
  getTimelineStatusLabel,
  type TimelineMode,
  type TimelineState,
} from "@/lib/timeline/model";

const Chrono = dynamic(
  () => import("react-chrono").then((module) => module.Chrono),
  {
    ssr: false,
  },
);

const TIMELINE_PREVIEW_MIN_HEIGHT = 580;
const TIMELINE_PREVIEW_CARD_WIDTH = 680;
const TIMELINE_PREVIEW_LINE_WIDTH = 3;

type ChronoSelectionPayload = {
  index: number;
};

type TimelinePreviewProps = {
  onSelectItem: (itemId: string) => void;
  state: TimelineState;
  zoom?: number;
};

function getSafeTimelineZoom(zoom: number) {
  if (!Number.isFinite(zoom) || zoom <= 0) {
    return 1;
  }

  return Number(zoom.toFixed(2));
}

export function TimelinePreview({
  state,
  onSelectItem,
  zoom = 1,
}: TimelinePreviewProps) {
  const items = useMemo(() => getSortedValidTimelineItems(state.items), [state.items]);
  const activeItemIndex = Math.max(
    0,
    items.findIndex((item) => item.id === state.selectedItemId),
  );
  const safeZoom = getSafeTimelineZoom(zoom);
  const inverseZoom = Number((1 / safeZoom).toFixed(4));

  const chronoItems = useMemo<TimelineItem[]>(
    () =>
      items.map((item) => ({
        id: item.id,
        title: item.date,
        cardTitle: item.name,
        cardSubtitle: `${item.section ?? "기본 섹션"} · ${item.owner?.trim() || "담당자 미정"}`,
        cardDetailedText: item.notes?.trim() || "설명이 비어 있습니다.",
      })),
    [items],
  );

  const children = useMemo(
    () =>
      items.map((item) => (
        <article
          className="timeline-item-content"
          key={item.id}
          style={{ "--timeline-item-color": item.color ?? "#5B6EE1" } as CSSProperties}
        >
          <div className="timeline-item-content-top">
            <span className="timeline-item-section">{item.section ?? "기본 섹션"}</span>
            <span className={`timeline-item-status status-${item.status ?? "planned"}`}>
              {getTimelineStatusLabel(item.status)}
            </span>
          </div>
          <div className="timeline-item-content-title">{item.name}</div>
          <div className="timeline-item-content-meta">
            <span>{item.date}</span>
            <span>{item.owner?.trim() || "담당자 미정"}</span>
          </div>
          <p>{item.notes?.trim() || "설명이 비어 있습니다."}</p>
        </article>
      )),
    [items],
  );

  const zoomShellStyle = useMemo<CSSProperties>(
    () => ({
      minHeight: `${Math.ceil(TIMELINE_PREVIEW_MIN_HEIGHT * inverseZoom)}px`,
    }),
    [inverseZoom],
  );

  const zoomStageStyle = useMemo<CSSProperties>(
    () => ({
      "--timeline-preview-zoom": String(safeZoom),
      "--timeline-preview-zoom-inverse": String(inverseZoom),
      transform: `scale(${safeZoom})`,
      transformOrigin: "top left",
      width: `${inverseZoom * 100}%`,
      minHeight: `${Math.ceil(TIMELINE_PREVIEW_MIN_HEIGHT * inverseZoom)}px`,
    }),
    [inverseZoom, safeZoom],
  );

  if (items.length === 0) {
    return (
      <div className="preview-placeholder">
        <strong>타임라인</strong>
        <p>이벤트를 추가하면 타임라인 preview가 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="timeline-preview-surface">
      <div className="timeline-preview-scrollport">
        <div className="timeline-preview-zoom-shell" style={zoomShellStyle}>
          <div className="timeline-preview-zoom-stage" style={zoomStageStyle}>
            <Chrono
              activeItemIndex={activeItemIndex}
              display={{
                scrollable: false,
                toolbar: {
                  enabled: false,
                },
              }}
              items={chronoItems}
              layout={{
                cardHeight: "auto",
                cardWidth: TIMELINE_PREVIEW_CARD_WIDTH,
                lineWidth: TIMELINE_PREVIEW_LINE_WIDTH,
              }}
              mode={state.mode as TimelineMode}
              style={{
                classNames: {
                  card: "timeline-preview-card",
                  cardSubTitle: "timeline-preview-card-subtitle",
                  cardText: "timeline-preview-card-text",
                  cardTitle: "timeline-preview-card-title",
                  title: "timeline-preview-title",
                },
                fontSizes: {
                  cardSubtitle: "14px",
                  cardText: "14px",
                  cardTitle: "16px",
                  title: "14px",
                },
              }}
              theme={{
                primary: "#5B6EE1",
                secondary: "#F7F8FA",
                cardBgColor: "#FFFFFF",
                cardSubtitleColor: "#667085",
                cardTitleColor: "#1F2937",
                detailsColor: "#475467",
                textColor: "#1F2937",
                titleColor: "#344054",
              }}
              onItemSelected={({ index }: ChronoSelectionPayload) => {
                const item = items[index];

                if (item) {
                  onSelectItem(item.id);
                }
              }}
            >
              {children}
            </Chrono>
          </div>
        </div>
      </div>
    </div>
  );
}
