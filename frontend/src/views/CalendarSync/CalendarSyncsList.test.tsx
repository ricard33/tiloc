import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import CalendarSyncsList from "./CalendarSyncsList";

vi.mock("axios");

const lodgings = { count: 1, results: [{ id: 1, name: "Villa" }] };
const channels = { count: 1, results: [{ id: 5, name: "Airbnb" }] };
const syncs = {
  count: 1,
  results: [
    {
      id: 3,
      lodging: { id: 1, name: "Villa" },
      channel: { id: 5, name: "Airbnb" },
      active: true,
      last_import: "2026-09-01T10:00:00Z",
      last_export: "2026-09-01T10:00:00Z",
    },
  ],
};

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    const url = String(config?.url ?? "");
    if (url.includes("booking_channel_sync")) return { data: syncs, status: 200 };
    if (url.includes("lodging")) return { data: lodgings, status: 200 };
    if (url.includes("booking_channel")) return { data: channels, status: 200 };
    return { data: syncs, status: 200 };
  });
});
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/calendar-syncs" element={<CalendarSyncsList />} />
    <Route path="/calendar-syncs/new" element={<div>new sync</div>} />
    <Route path="/calendar-syncs/:id" element={<div>sync detail</div>} />
  </Routes>
);

const dataRows = () => screen.getAllByRole("row").filter((r) => r.getAttribute("data-rowindex") !== null);

describe("CalendarSyncsList", () => {
  it("renders the grid with one data row and an enabled Create tool", async () => {
    renderWithProviders(routes, {
      route: "/calendar-syncs",
      user: { permissions: ["core.view_bookingchannelsync", "core.add_bookingchannelsync"] },
    });

    await vi.waitFor(() => expect(dataRows()).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Create" })).toBeEnabled();
  });

  it("navigates to the create form via the Create tool", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: "/calendar-syncs",
      user: { permissions: ["core.add_bookingchannelsync"] },
    });
    await vi.waitFor(() => expect(dataRows()).toHaveLength(1));

    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("new sync")).toBeInTheDocument();
  });

  it("opens a row on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: "/calendar-syncs",
      user: { permissions: ["core.view_bookingchannelsync"] },
    });
    await vi.waitFor(() => expect(dataRows()).toHaveLength(1));

    await user.click(dataRows()[0]);
    expect(await screen.findByText("sync detail")).toBeInTheDocument();
  });
});
