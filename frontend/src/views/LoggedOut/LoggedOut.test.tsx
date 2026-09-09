import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../common/testRender";
import LoggedOut from "./LoggedOut";

describe("LoggedOut", () => {
  it("confirms the logout and links back to /login", () => {
    renderWithProviders(<LoggedOut />);
    expect(screen.getByText("You are now logged out.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  });
});
