import React from "react";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import Main from "./Main";

vi.mock("axios");

const appInfo = { loaded: true, frontendVersion: "1.0.0", version: "1.0.0", buildDate: "2026-09-01" };

const trialing = (daysLeft: number) => ({
  trial_is_over: false,
  current_subscription: {
    status: "trialing",
    current_period_end: new Date(Date.now() + daysLeft * 86400000),
  },
});

const renderMain = (route: string, account: Record<string, unknown>, info = appInfo) =>
  renderWithProviders(
    <Routes>
      <Route element={<Main />}>
        <Route path="/bookings" element={<div>bookings page</div>} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
      </Route>
    </Routes>,
    { route, user: { permissions: [] }, account, preloadedState: { appInfo: info } }
  );

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

describe("Main layout", () => {
  it("renders the routed page, a Home breadcrumb and the footer", () => {
    renderMain("/bookings", { trial_is_over: false });
    expect(screen.getByText("bookings page")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument(); // last breadcrumb, mapped label
    expect(screen.getByRole("link", { name: "Tiloc" })).toBeInTheDocument(); // footer
  });

  it("shows a trial alert while the subscription is trialing", () => {
    renderMain("/dashboard", trialing(4));
    expect(screen.getByText(/End of trial period/)).toBeInTheDocument();
  });

  it("warns when the deployed version differs from the frontend build", () => {
    renderMain("/dashboard", { trial_is_over: false }, { ...appInfo, version: "2.0.0" });
    expect(screen.getByText(/newer version of Tiloc/)).toBeInTheDocument();
  });

  it("sets the document title from the current route", () => {
    renderMain("/bookings", { trial_is_over: false });
    expect(document.title).toEqual("Tiloc - Bookings");
  });
});
