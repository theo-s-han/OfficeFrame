import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("execution skeleton smoke", () => {
  it("renders the home hub with the active gantt entry", () => {
    render(<HomePage />);

    expect(screen.getByText("문서용 시각화 허브")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "간트 차트" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "시작하기" })).toHaveAttribute(
      "href",
      "/gantt",
    );
  });
});
