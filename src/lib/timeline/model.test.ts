import {
  createSampleTimelineState,
  validateTimelineState,
} from "./model";

describe("timeline model", () => {
  it("accepts sample data", () => {
    const sample = createSampleTimelineState();

    expect(validateTimelineState(sample.items)).toEqual([]);
  });

  it("rejects invalid dates", () => {
    const sample = createSampleTimelineState();

    sample.items[0] = {
      ...sample.items[0],
      date: "2026-04",
    };

    expect(validateTimelineState(sample.items)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          itemId: sample.items[0]?.id,
          field: "date",
        }),
      ]),
    );
  });
});
