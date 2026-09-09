import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import BookingList from "./BookingList";

vi.mock("axios");

const bookings = {
  count: 1,
  results: [
    {
      id: 42,
      guest_name: "John Traveller",
      lodgings: [{ id: 1, name: "Villa" }],
      begin_date: "2026-06-10",
      end_date: "2026-06-17",
      status: "paid",
      created: "2026-01-01",
      modified: "2026-01-01",
    },
  ],
};

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    if (String(config?.url ?? "").includes("lodging")) return { data: { count: 0, results: [] }, status: 200 };
    return { data: bookings, status: 200 };
  });
});
afterEach(() => vi.clearAllMocks());

describe("BookingList", () => {
  it("renders the grid, the 'Add booking' tool and the toolbar controls", async () => {
    renderWithProviders(<BookingList />, {
      user: { permissions: ["core.view_booking", "core.add_booking"] },
    });

    expect(await screen.findByRole("button", { name: "Add booking" })).toBeEnabled();
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(1);
  });

  it("disables 'Add booking' without the add permission", async () => {
    renderWithProviders(<BookingList />, { user: { permissions: ["core.view_booking"] } });
    expect(await screen.findByRole("button", { name: "Add booking" })).toBeDisabled();
  });
});
