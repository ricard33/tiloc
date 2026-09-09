import React from "react";
import { screen } from "@testing-library/react";
import ExternalLink from "./ExternalLink";
import { renderWithProviders } from "../common/testRender";

describe("ExternalLink", () => {
  it("renders the label and opens the href in a new tab", () => {
    renderWithProviders(<ExternalLink label="Docs" href="https://example.com/docs" />);
    const link = screen.getByRole("link", { name: /Docs/ });
    expect(link).toHaveAttribute("href", "https://example.com/docs");
    expect(link).toHaveAttribute("target", "_blank");
  });
});
