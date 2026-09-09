import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import LatestBookings from "./LatestBookings";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const bookings = {
  count: 1,
  results: [
    {
      id: 5,
      guest_name: "John Traveller",
      lodgings: [{ id: 1, name: "Villa" }],
      begin_date: "2026-07-01",
      end_date: "2026-07-08",
      duration: 7,
      adults: 2,
      children: 1,
      babies: 0,
      price: 700,
      created: "2026-01-01",
      modified: "2026-01-01",
    },
  ],
};

describe("LatestBookings", () => {
  it("lists the most recent bookings with guest, dates and price", async () => {
    (axios as any).mockResolvedValue({ data: bookings, status: 200 });
    renderWithProviders(<LatestBookings />, { user: { permissions: [] } });

    expect(await screen.findByText("Latest bookings")).toBeInTheDocument();
    expect(await screen.findByText("John Traveller")).toBeInTheDocument();
    expect(screen.getByText(/700 €/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all/ })).toHaveAttribute("href", "/planning");
  });
});
