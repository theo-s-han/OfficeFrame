import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows the active gantt entry and future placeholders", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "오피스 문서에 바로 쓰는 시각화 도구",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "시작하기" })).toHaveAttribute(
      "href",
      "/gantt",
    );
    expect(screen.getAllByText("준비중")).toHaveLength(8);
  });
});
