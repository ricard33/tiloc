import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../common/testRender";
import BookingQuickView from "./BookingQuickView";
import type { Booking } from "../types";

vi.mock("axios");
beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

const booking = {
  id: 42,
  guest_name: "John Traveller",
  guest_contact: "john@example.com",
  guest_address: "1 Main St",
  lodgings: [{ id: 1, name: "Villa Rose" }],
  begin_date: new Date("2026-07-01"),
  end_date: new Date("2026-07-08"),
  duration: 7,
  status: "paid",
  source: null,
  adults: 2,
  children: 1,
  babies: 0,
  guests_distribution: { 1: { adults: 2, children: 1, babies: 0 } },
  price: 700,
  price_with_options: 700,
  price_with_options_and_taxes: 700,
  deposit: 200,
  left_to_pay: 0,
  total_payments: 700,
  comments: [],
  options: [],
} as unknown as Booking;

describe("BookingQuickView", () => {
  it("shows the stay dates, status and guest distribution", () => {
    renderWithProviders(<BookingQuickView booking={booking} />, {
      user: { permissions: ["core.view_booking"] },
    });

    expect(screen.getByText("Check-in")).toBeInTheDocument();
    expect(screen.getByText("Check-out")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText(/2 adults/)).toBeInTheDocument();
  });

  it("triggers a payments fetch when the user may view payments", async () => {
    renderWithProviders(<BookingQuickView booking={booking} />, {
      user: { permissions: ["core.view_payment", "core.view_comment"] },
    });

    await vi.waitFor(() =>
      expect(
        (axios as any).mock.calls.some(([c]: any[]) => String(c?.url ?? "").includes("payment/"))
      ).toBe(true)
    );
  });
});
