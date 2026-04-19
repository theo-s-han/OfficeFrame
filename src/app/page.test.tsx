import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("HomePage", () => {
  it("shows all active visualization tools", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(5);

    const startLinks = screen.getAllByRole("link");
    const hrefs = startLinks.map((link) => link.getAttribute("href"));

    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/gantt",
        "/mindmap",
        "/org-chart",
        "/flowchart",
        "/timeline",
      ]),
    );
  });
});
