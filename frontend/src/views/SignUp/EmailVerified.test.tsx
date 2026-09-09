import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../common/testRender";
import { EmailVerified } from "./EmailVerified";

describe("EmailVerified", () => {
  it("confirms verification and links to the dashboard", () => {
    renderWithProviders(<EmailVerified />);
    expect(screen.getByText("Email verified")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Tiloc Dashboard" })).toHaveAttribute("href", "/");
  });
});
