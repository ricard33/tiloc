import React from "react";
import { screen } from "@testing-library/react";
import { Section } from "./Section";
import { renderWithProviders } from "../common/testRender";

describe("Section", () => {
  it("renders the header, sub-header and children (expanded by default)", () => {
    renderWithProviders(
      <Section header="Details" subHeader="more info">
        <p>body content</p>
      </Section>
    );

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("more info")).toBeInTheDocument();
    expect(screen.getByText("body content")).toBeVisible();
  });
});
