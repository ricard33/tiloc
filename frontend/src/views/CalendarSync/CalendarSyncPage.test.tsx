import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import CalendarSyncPage from "./CalendarSyncPage";

vi.mock("axios");

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    const url = String(config?.url ?? "");
    if (url.includes("lodging")) return { data: { count: 1, results: [{ id: 1, name: "Villa" }] }, status: 200 };
    if (url.includes("booking_channel")) return { data: { count: 1, results: [{ id: 5, name: "Airbnb" }] }, status: 200 };
    return { data: {}, status: 200 };
  });
});
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/calendar-syncs/new" element={<CalendarSyncPage />} />
    <Route path="/calendar-syncs" element={<div>syncs list</div>} />
  </Routes>
);

describe("CalendarSyncPage", () => {
  it("renders the sync form in create mode", async () => {
    renderWithProviders(routes, {
      route: ["/calendar-syncs", "/calendar-syncs/new"],
      user: { permissions: ["core.add_bookingchannelsync"] },
    });
    expect(await screen.findByText("Calendar synchronization properties")).toBeInTheDocument();
  });

  it("returns to the list from the Close button", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: ["/calendar-syncs", "/calendar-syncs/new"],
      user: { permissions: ["core.add_bookingchannelsync"] },
    });
    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(await screen.findByText("syncs list")).toBeInTheDocument();
  });
});
