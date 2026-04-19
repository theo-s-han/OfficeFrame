import {
  createTimelineExportDebugSnapshot,
  getTimelineExportElement,
  getTimelineExportMetrics,
  getTimelineExportNodeMetrics,
  getTimelineExportRenderSize,
  getTimelineExportSize,
  prepareTimelineExportTarget,
} from "./export";

describe("timeline export", () => {
  it("targets the full preview surface for export", () => {
    document.body.innerHTML = `
      <div id="source">
        <div class="timeline-preview-surface">
          <div class="timeline-preview-scrollport">
            <div class="timeline-preview-zoom-shell">
              <div class="timeline-preview-zoom-stage"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const source = document.getElementById("source") as HTMLElement;

    expect(getTimelineExportElement(source)).toBe(
      source.querySelector(".timeline-preview-surface"),
    );
  });

  it("measures only the rendered timeline content bounds", () => {
    document.body.innerHTML = `
      <div id="target" class="timeline-preview-zoom-shell">
        <div class="timeline-preview-zoom-stage">
            <div class="timeline-wrapper"></div>
            <div class="timeline-preview-title"></div>
            <div class="timeline-preview-card"></div>
        </div>
      </div>
    `;

    const target = document.getElementById("target") as HTMLElement;
    const structuralWrapper = target.querySelector(".timeline-wrapper") as HTMLElement;
    const title = target.querySelector(".timeline-preview-title") as HTMLElement;
    const card = target.querySelector(".timeline-preview-card") as HTMLElement;

    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      width: 1200,
      height: 760,
      top: 0,
      left: 0,
      right: 1200,
      bottom: 760,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    Object.defineProperty(target, "scrollWidth", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(target, "scrollHeight", {
      configurable: true,
      value: 760,
    });

    vi.spyOn(structuralWrapper, "getBoundingClientRect").mockReturnValue({
      width: 1200,
      height: 620,
      top: 20,
      left: 20,
      right: 1220,
      bottom: 640,
      x: 20,
      y: 20,
      toJSON: () => ({}),
    });
    vi.spyOn(title, "getBoundingClientRect").mockReturnValue({
      width: 96,
      height: 40,
      top: 28,
      left: 28,
      right: 124,
      bottom: 68,
      x: 28,
      y: 28,
      toJSON: () => ({}),
    });
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      width: 412,
      height: 188,
      top: 92,
      left: 112,
      right: 524,
      bottom: 280,
      x: 112,
      y: 92,
      toJSON: () => ({}),
    });

    expect(getTimelineExportSize(target)).toEqual({
      width: 548,
      height: 304,
    });
  });

  it("reports aligned output and render ratios from the same metrics", () => {
    document.body.innerHTML = `
      <div id="target" class="timeline-preview-zoom-shell">
        <div class="timeline-preview-zoom-stage" style="--timeline-preview-zoom: 0.8;"></div>
        <div class="timeline-preview-title"></div>
        <div class="timeline-preview-card"></div>
      </div>
    `;

    const target = document.getElementById("target") as HTMLElement;
    const title = target.querySelector(".timeline-preview-title") as HTMLElement;
    const card = target.querySelector(".timeline-preview-card") as HTMLElement;

    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      width: 820,
      height: 410,
      top: 0,
      left: 0,
      right: 820,
      bottom: 410,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    vi.spyOn(title, "getBoundingClientRect").mockReturnValue({
      width: 96,
      height: 40,
      top: 24,
      left: 24,
      right: 120,
      bottom: 64,
      x: 24,
      y: 24,
      toJSON: () => ({}),
    });
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      width: 560,
      height: 220,
      top: 92,
      left: 180,
      right: 740,
      bottom: 312,
      x: 180,
      y: 92,
      toJSON: () => ({}),
    });

    const metrics = getTimelineExportMetrics(target);
    const outputRatio = metrics.outputSize.width / metrics.outputSize.height;
    const renderRatio = metrics.renderSize.width / metrics.renderSize.height;

    expect(metrics.zoom).toBe(0.8);
    expect(Math.abs(outputRatio - renderRatio)).toBeLessThan(0.01);
  });

  it("waits when no visible timeline nodes exist yet", () => {
    const target = document.createElement("div");

    expect(getTimelineExportSize(target)).toEqual({
      width: 0,
      height: 0,
    });
  });

  it("derives the render size from the visible content bounds and zoom", () => {
    document.body.innerHTML = `
      <div id="target" class="timeline-preview-zoom-shell">
        <div class="timeline-preview-zoom-stage" style="--timeline-preview-zoom: 0.8;"></div>
        <div class="timeline-preview-title"></div>
        <div class="timeline-preview-card"></div>
      </div>
    `;

    const target = document.getElementById("target") as HTMLElement;
    const title = target.querySelector(".timeline-preview-title") as HTMLElement;
    const card = target.querySelector(".timeline-preview-card") as HTMLElement;

    vi.spyOn(target, "getBoundingClientRect").mockReturnValue({
      width: 820,
      height: 410,
      top: 0,
      left: 0,
      right: 820,
      bottom: 410,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    vi.spyOn(title, "getBoundingClientRect").mockReturnValue({
      width: 96,
      height: 40,
      top: 24,
      left: 24,
      right: 120,
      bottom: 64,
      x: 24,
      y: 24,
      toJSON: () => ({}),
    });
    vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
      width: 560,
      height: 220,
      top: 92,
      left: 180,
      right: 740,
      bottom: 312,
      x: 180,
      y: 92,
      toJSON: () => ({}),
    });

    expect(getTimelineExportRenderSize(target)).toEqual({
      width: 955,
      height: 420,
    });
  });

  it("forces hidden timeline rows visible during export and restores styles after cleanup", async () => {
    document.body.innerHTML = `
      <div id="source">
        <div class="timeline-preview-surface" style="overflow:hidden;">
          <div class="timeline-preview-scrollport" style="height:580px; overflow:auto;">
            <div class="timeline-preview-zoom-shell">
              <div class="card-content-wrapper" style="visibility:hidden; opacity:0; animation:fade 1s;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const source = document.getElementById("source") as HTMLElement;
    const target = source.querySelector(".timeline-preview-zoom-shell") as HTMLElement;
    const scrollport = source.querySelector(".timeline-preview-scrollport") as HTMLElement;
    const hiddenCard = source.querySelector(".card-content-wrapper") as HTMLElement;

    scrollport.scrollTop = 240;
    scrollport.scrollLeft = 32;

    const cleanup = await prepareTimelineExportTarget(target, source);

    expect(hiddenCard.style.visibility).toBe("visible");
    expect(hiddenCard.style.opacity).toBe("1");
    expect(hiddenCard.style.animation).toBe("none");
    expect(scrollport.style.overflow).toBe("visible");
    expect(scrollport.style.height).toBe("auto");
    expect(scrollport.scrollTop).toBe(0);
    expect(scrollport.scrollLeft).toBe(0);

    cleanup?.();

    expect(hiddenCard.style.visibility).toBe("hidden");
    expect(hiddenCard.style.opacity).toBe("0");
    expect(hiddenCard.style.animation).toBe("fade 1s");
    expect(scrollport.style.overflow).toBe("auto");
    expect(scrollport.style.height).toBe("580px");
    expect(scrollport.scrollTop).toBe(240);
    expect(scrollport.scrollLeft).toBe(32);
  });

  it("keeps export size aligned with the full node set after hidden rows are expanded", async () => {
    const rowsMarkup = Array.from({ length: 7 }, (_, index) => {
      const hiddenStyle =
        index >= 3 ? ' style="visibility:hidden; opacity:0;"' : "";

      return `
        <div class="vertical-item-row" data-testid="vertical-item-row"${hiddenStyle}>
          <div class="card-content-wrapper"${hiddenStyle}>
            <div class="timeline-preview-card"${hiddenStyle}>
              <article class="timeline-item-content"${hiddenStyle}></article>
            </div>
          </div>
          <div class="timeline-title-section">
            <div class="timeline-preview-title"${hiddenStyle}></div>
          </div>
          <div class="timeline-point-section"></div>
        </div>
      `;
    }).join("");

    document.body.innerHTML = `
      <div id="source">
        <div class="timeline-preview-surface" style="overflow:hidden;">
          <div class="timeline-preview-scrollport" style="height:580px; overflow:auto;">
            <div id="target" class="timeline-preview-zoom-shell">
              <div class="timeline-preview-zoom-stage" style="--timeline-preview-zoom: 0.8;">
                <div class="timeline-wrapper"></div>
                ${rowsMarkup}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const source = document.getElementById("source") as HTMLElement;
    const structuralWrapper = source.querySelector(".timeline-wrapper") as HTMLElement;
    const titles = Array.from(
      source.querySelectorAll<HTMLElement>(".timeline-preview-title"),
    );
    const cards = Array.from(source.querySelectorAll<HTMLElement>(".timeline-preview-card"));
    const contents = Array.from(
      source.querySelectorAll<HTMLElement>(".timeline-item-content"),
    );
    const hiddenRows = Array.from(
      source.querySelectorAll<HTMLElement>('[data-testid="vertical-item-row"]'),
    ).slice(3);

    vi.spyOn(structuralWrapper, "getBoundingClientRect").mockReturnValue({
      width: 1200,
      height: 1560,
      top: 0,
      left: 0,
      right: 1200,
      bottom: 1560,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    titles.forEach((title, index) => {
      const top = 24 + index * 220;
      const left = index % 2 === 0 ? 76 : 692;

      vi.spyOn(title, "getBoundingClientRect").mockReturnValue({
        width: 96,
        height: 40,
        top,
        left,
        right: left + 96,
        bottom: top + 40,
        x: left,
        y: top,
        toJSON: () => ({}),
      });
    });

    cards.forEach((card, index) => {
      const top = 88 + index * 220;
      const left = index % 2 === 0 ? 48 : 620;

      vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
        width: 520,
        height: 152,
        top,
        left,
        right: left + 520,
        bottom: top + 152,
        x: left,
        y: top,
        toJSON: () => ({}),
      });
    });

    contents.forEach((content, index) => {
      const top = 104 + index * 220;
      const left = index % 2 === 0 ? 64 : 636;

      vi.spyOn(content, "getBoundingClientRect").mockReturnValue({
        width: 488,
        height: 120,
        top,
        left,
        right: left + 488,
        bottom: top + 120,
        x: left,
        y: top,
        toJSON: () => ({}),
      });
    });

    const exportTarget = getTimelineExportElement(source);

    vi.spyOn(exportTarget, "getBoundingClientRect").mockReturnValue({
      width: 1200,
      height: 580,
      top: 0,
      left: 0,
      right: 1200,
      bottom: 580,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    Object.defineProperty(exportTarget, "scrollWidth", {
      configurable: true,
      value: 1200,
    });
    Object.defineProperty(exportTarget, "scrollHeight", {
      configurable: true,
      value: 1600,
    });

    expect(getTimelineExportNodeMetrics(exportTarget)).toEqual({
      totalNodeCount: 7,
      measurableNodeCount: 3,
    });

    const cleanup = await prepareTimelineExportTarget(exportTarget, source);
    const metrics = getTimelineExportMetrics(exportTarget);
    const outputRatio = metrics.outputSize.width / metrics.outputSize.height;
    const renderRatio = metrics.renderSize.width / metrics.renderSize.height;
    const scrollport = source.querySelector(".timeline-preview-scrollport") as HTMLElement;
    const zoomShell = source.querySelector(".timeline-preview-zoom-shell") as HTMLElement;
    const zoomStage = source.querySelector(".timeline-preview-zoom-stage") as HTMLElement;

    expect(hiddenRows.every((row) => row.style.visibility === "visible")).toBe(true);
    expect(hiddenRows.every((row) => row.style.opacity === "1")).toBe(true);
    expect(metrics.totalNodeCount).toBe(7);
    expect(metrics.measurableNodeCount).toBe(7);
    expect(scrollport.style.height).toBe("1980px");
    expect(scrollport.style.width).toBe("1455px");
    expect(zoomShell.style.minHeight).toBe("1980px");
    expect(zoomStage.style.width).toBe("1455px");
    expect(getTimelineExportSize(exportTarget)).toEqual({
      width: 1164,
      height: 1584,
    });
    expect(getTimelineExportRenderSize(exportTarget)).toEqual({
      width: 1455,
      height: 1980,
    });
    expect(Math.abs(outputRatio - renderRatio)).toBeLessThan(0.01);

    cleanup?.();

    expect(hiddenRows.every((row) => row.style.visibility === "hidden")).toBe(true);
    expect(hiddenRows.every((row) => row.style.opacity === "0")).toBe(true);
    expect(scrollport.style.height).toBe("580px");
    expect(scrollport.style.width).toBe("");
    expect(zoomShell.style.minHeight).toBe("");
    expect(zoomStage.style.width).toBe("");
  });

  it("creates a debug snapshot that shows clipped content outside the current target rect", () => {
    document.body.innerHTML = `
      <div id="source">
        <div class="timeline-preview-surface" aria-label="timeline-preview-surface">
          <div class="timeline-preview-scrollport">
            <div class="timeline-preview-zoom-shell">
              <div class="timeline-preview-zoom-stage" style="--timeline-preview-zoom: 0.8;">
                <article class="timeline-item-content">첫 번째 일정</article>
                <article class="timeline-item-content" style="visibility:hidden; opacity:0;">숨김 일정</article>
                <article class="timeline-item-content">가장 아래 일정</article>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const source = document.getElementById("source") as HTMLElement;
    const exportTarget = getTimelineExportElement(source);
    const zoomStage = source.querySelector(".timeline-preview-zoom-stage") as HTMLElement;
    const nodes = Array.from(source.querySelectorAll<HTMLElement>(".timeline-item-content"));

    vi.spyOn(exportTarget, "getBoundingClientRect").mockReturnValue({
      width: 600,
      height: 320,
      top: 0,
      left: 0,
      right: 600,
      bottom: 320,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(exportTarget, "scrollWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(exportTarget, "scrollHeight", {
      configurable: true,
      value: 920,
    });

    vi.spyOn(zoomStage, "getBoundingClientRect").mockReturnValue({
      width: 640,
      height: 920,
      top: 0,
      left: 0,
      right: 640,
      bottom: 920,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    vi.spyOn(nodes[0]!, "getBoundingClientRect").mockReturnValue({
      width: 320,
      height: 96,
      top: 24,
      left: 40,
      right: 360,
      bottom: 120,
      x: 40,
      y: 24,
      toJSON: () => ({}),
    });
    vi.spyOn(nodes[1]!, "getBoundingClientRect").mockReturnValue({
      width: 320,
      height: 96,
      top: 184,
      left: 40,
      right: 360,
      bottom: 280,
      x: 40,
      y: 184,
      toJSON: () => ({}),
    });
    vi.spyOn(nodes[2]!, "getBoundingClientRect").mockReturnValue({
      width: 360,
      height: 120,
      top: 744,
      left: 220,
      right: 580,
      bottom: 864,
      x: 220,
      y: 744,
      toJSON: () => ({}),
    });

    const snapshot = createTimelineExportDebugSnapshot(source, "initial", exportTarget);

    expect(snapshot.phase).toBe("initial");
    expect(snapshot.target.dataTestId).toBeNull();
    expect(snapshot.target.ariaLabel).toBe("timeline-preview-surface");
    expect(snapshot.nodeSummary.totalNodeCount).toBe(3);
    expect(snapshot.nodeSummary.measurableNodeCount).toBe(2);
    expect(snapshot.nodeSummary.clippedVerticalCount).toBe(1);
    expect(snapshot.nodeSummary.firstHiddenNode?.index).toBe(1);
    expect(snapshot.nodeSummary.firstVerticalClippedNode?.index).toBe(2);
    expect(snapshot.overflowSummary.heightDelta).toBeGreaterThan(0);
    expect(snapshot.metrics.totalNodeCount).toBe(3);
  });
});
