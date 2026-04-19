import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows only representative featured tools on the home hub", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "업무 데이터를 문서형 시각화로 바로 정리하세요",
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("DataViz Studio").length).toBeGreaterThan(0);

    screen
      .getAllByRole("link", { name: "간트 차트 시작하기" })
      .forEach((link) => expect(link).toHaveAttribute("href", "/gantt"));
    screen
      .getAllByRole("link", { name: "마인드맵 열기" })
      .forEach((link) => expect(link).toHaveAttribute("href", "/mindmap"));
    screen
      .getAllByRole("link", { name: "조직도 열기" })
      .forEach((link) => expect(link).toHaveAttribute("href", "/org-chart"));
    screen
      .getAllByRole("link", { name: "플로우차트 열기" })
      .forEach((link) => expect(link).toHaveAttribute("href", "/flowchart"));

    expect(screen.queryByText("타임라인")).not.toBeInTheDocument();
    expect(screen.queryByText("캐릭터 포즈 메이커")).not.toBeInTheDocument();
  });
});
