import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import Footer from "./Footer";

describe("Footer", () => {
  it("renders the Tiloc link and the current year", () => {
    renderWithProviders(<Footer />);
    const link = screen.getByRole("link", { name: "Tiloc" });
    expect(link).toHaveAttribute("href", "https://tiloc.fr/");
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
