import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../../common/testRender";
import Profile from "./Profile";

describe("Profile", () => {
  it("shows the current user's name and links the avatar to /settings", () => {
    renderWithProviders(<Profile />, {
      user: { full_name: "Alice Martin", email: "alice@example.com", permissions: [] },
    });

    expect(screen.getByText("Alice Martin")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/settings");
  });
});
