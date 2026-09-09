import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import Topbar from "./Topbar";

vi.mock("axios");

const logout = vi.fn();
vi.mock("../../../common/authUtils", () => ({ useAuth: () => ({ logout }) }));

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

const renderTopbar = () =>
  renderWithProviders(<Topbar onSidebarOpen={vi.fn()} />, {
    user: { full_name: "Alice Martin", email: "alice@example.com", permissions: [] },
    account: { id: "acme" },
  });

describe("Main <Topbar>", () => {
  it("opens the user menu with account info and account/logout entries", async () => {
    const user = userEvent.setup();
    renderTopbar();

    await user.click(screen.getAllByRole("img", { name: "Person" })[0]); // topbar avatar

    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("alice@example.com")).toBeInTheDocument();
    expect(within(menu).getByText(/acme/)).toBeInTheDocument();
    expect(within(menu).getByRole("menuitem", { name: /My account/ })).toHaveAttribute("href", "/account");
    expect(within(menu).getByRole("menuitem", { name: /Logout/ })).toBeInTheDocument();
  });

  it("logs out from the menu", async () => {
    const user = userEvent.setup();
    renderTopbar();

    await user.click(screen.getAllByRole("img", { name: "Person" })[0]); // avatar
    await user.click(await screen.findByRole("menuitem", { name: /Logout/ }));

    expect(logout).toHaveBeenCalled();
  });
});
