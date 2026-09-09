import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import NextEvents from "./NextEvents";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const event = {
  id: 1,
  event_type: "CHECKIN",
  date: "2026-07-01",
  guest_name: "John Traveller",
  guests: 3,
  duration: 7,
  lodgings: [{ id: 1, name: "Villa" }],
  status: "paid",
  begin_date: "2026-07-01",
  end_date: "2026-07-08",
  created: "2026-01-01",
  modified: "2026-01-01",
};

describe("NextEvents", () => {
  it("renders one InOutEvent per upcoming event", async () => {
    (axios as any).mockResolvedValue({ data: [event], status: 200 });
    renderWithProviders(<NextEvents />, { user: { permissions: [] } });

    expect(await screen.findByText(/John Traveller/)).toBeInTheDocument();
    expect(screen.getByText(/Villa/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View planning/ })).toHaveAttribute("href", "/planning");
  });

  it("shows an empty message when there is nothing coming up", async () => {
    (axios as any).mockResolvedValue({ data: [], status: 200 });
    renderWithProviders(<NextEvents />, { user: { permissions: [] } });

    expect(await screen.findByText(/no upcoming reservations/)).toBeInTheDocument();
  });
});
