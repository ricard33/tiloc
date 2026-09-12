import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../common/testRender";
import Sidebar from "./Sidebar";

const appInfo = { frontendVersion: "1.0.0", version: "1.0.0", buildDate: "2026-09-01" };

const render = (route: string, account = { trial_is_over: false }) =>
  renderWithProviders(
    <Sidebar open variant="permanent" onClose={vi.fn()} width={170} />,
    { route, user: { permissions: [] }, account, preloadedState: { appInfo } }
  );

describe("Sidebar", () => {
  it("shows the main menu on the root route", () => {
    render("/");
    expect(screen.getByRole("link", { name: /Dashboard/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Bookings/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Settings/ })).toBeInTheDocument();
  });

  it("shows the account sub-menu on /account routes", () => {
    render("/account/subscription");
    expect(screen.getByRole("link", { name: /Subscription/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Back/ })).toHaveAttribute("href", "/");
  });

  it("links to the notification preferences page from the account sub-menu", () => {
    render("/account");
    expect(screen.getByRole("link", { name: /Notifications/ })).toHaveAttribute("href", "/account/notifications");
  });

  it("shows the upgrade panel once the trial is over", () => {
    render("/", { trial_is_over: true });
    expect(screen.getByText("Upgrade to PRO")).toBeInTheDocument();
  });

  it("prints the build version", () => {
    render("/");
    expect(screen.getByText(/build on/)).toHaveTextContent("2026-09-01");
  });
});
