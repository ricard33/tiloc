import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../../../common/testRender";
import Topbar from "./Topbar";

vi.mock("axios");

describe("Minimal <Topbar>", () => {
  it("links the logo home and shows no logout button when signed out", () => {
    renderWithProviders(<Topbar />, { user: null });
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("logs the user out through useAuth when the button is clicked", async () => {
    (axios as any).mockResolvedValue({ data: {}, status: 200 });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<Topbar />, {
      user: { full_name: "Alice", email: "a@b.c", permissions: [] },
    });

    await user.click(screen.getByRole("button"));

    await vi.waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(false));
    expect(
      (axios as any).mock.calls.some(([c]: any[]) => String(c.url).includes("auth/logout"))
    ).toBe(true);
  });
});
