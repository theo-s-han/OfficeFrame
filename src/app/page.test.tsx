import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows the active gantt and mindmap entries plus future placeholders", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        name: "오피스 문서에 바로 쓰는 시각화 도구",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "간트 차트" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "마인드맵" }),
    ).toBeInTheDocument();

    const startLinks = screen.getAllByRole("link", { name: "시작하기" });

    expect(startLinks).toHaveLength(2);
    expect(startLinks[0]).toHaveAttribute("href", "/gantt");
    expect(startLinks[1]).toHaveAttribute("href", "/mindmap");
    expect(screen.getAllByText("준비중")).toHaveLength(6);
  });
});
