import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("execution skeleton smoke", () => {
  it("renders the home hub with the active gantt and mindmap entries", () => {
    render(<HomePage />);

    expect(screen.getByText("문서용 시각화 허브")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "간트 차트" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "마인드맵" }),
    ).toBeInTheDocument();

    const startLinks = screen.getAllByRole("link", { name: "시작하기" });

    expect(startLinks[0]).toHaveAttribute("href", "/gantt");
    expect(startLinks[1]).toHaveAttribute("href", "/mindmap");
  });
});
