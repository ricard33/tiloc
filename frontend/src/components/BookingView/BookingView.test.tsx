import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import BookingView from "./BookingView";
import type { Booking } from "../../types";

vi.mock("axios");
beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

vi.mock("../BookingQuickView", () => ({ default: () => <div>quick view</div> }));

const booking = {
  id: 42,
  guest_name: "John Traveller",
  lodgings: [{ id: 1, name: "Villa Rose" }],
  begin_date: new Date("2026-07-01"),
  end_date: new Date("2026-07-08"),
  duration: 7,
  status: "paid",
  cancelled: false,
  price: 700,
  price_with_options: 700,
  daily_rate: 100,
  deposit: 200,
  guaranty: 300,
  commission_fees: 0,
  adults: 2,
  arrival_details: "",
  departure_details: "",
  options: [],
} as unknown as Booking;

const handlers = {
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onCancelBooking: vi.fn(),
  onUncancelBooking: vi.fn(),
};

describe("BookingView", () => {
  it("renders the details dialog with the quick view and a Close button", () => {
    renderWithProviders(<BookingView booking={booking} {...handlers} />, {
      user: { permissions: ["core.view_booking", "core.change_booking"] },
    });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("quick view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("calls onClose from the Close button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<BookingView booking={booking} {...handlers} onClose={onClose} />, {
      user: { permissions: ["core.view_booking"] },
    });

    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
