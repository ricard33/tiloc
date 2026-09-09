import React from "react";
import { screen } from "@testing-library/react";
import GuestContact from "./GuestContact";
import { renderWithProviders } from "../common/testRender";

describe("GuestContact", () => {
  it("renders nothing without a value", () => {
    const { container } = renderWithProviders(<GuestContact />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders one line per newline-separated entry", () => {
    renderWithProviders(<GuestContact value={"john@example.com\n06 12 34 56 78"} />);
    expect(screen.getByRole("link", { name: "john@example.com" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /06 12 34 56 78/ })).toBeInTheDocument();
  });
});
