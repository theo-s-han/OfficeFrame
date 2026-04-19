import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "./page";

describe("execution skeleton smoke", () => {
  it("renders the home hub with all active tools", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();

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
