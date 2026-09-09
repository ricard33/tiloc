import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import { TimelineView } from "./TimelineView";
import type { Booking, Lodging } from "../../../types";

vi.mock("axios");
beforeEach(() => (axios as any).mockResolvedValue({ data: { count: 0, results: [] }, status: 200 }));
afterEach(() => vi.clearAllMocks());

const lodgings = [
  { id: 1, name: "Villa Rose", rank: 1 },
  { id: 2, name: "Studio Blue", rank: 2 },
] as unknown as Lodging[];

const bookings = [
  {
    id: 10,
    guest_name: "John Traveller",
    lodgings: [lodgings[0]],
    lodging_ids: [1],
    begin_date: new Date("2026-06-10"),
    end_date: new Date("2026-06-17"),
    status: "paid",
    price: 700,
    price_with_options: 700,
    price_with_options_and_taxes: 700,
    left_to_pay: 0,
    total_payments: 700,
    payments: [],
    options: [],
    comments: [],
    adults: 2,
    children: 0,
    babies: 0,
    duration: 7,
  },
] as unknown as Booking[];

const settings = { monthsToDisplay: 3, showPaymentStatus: true, showPrices: false, anonymized: false };

describe("TimelineView", () => {
  it("renders a row per lodging and a month header", () => {
    renderWithProviders(
      <TimelineView
        lodgings={lodgings}
        bookings={bookings}
        settings={settings}
        defaultBeginDate={new Date("2026-06-01")}
      />,
      { user: { permissions: ["core.view_booking"] } }
    );

    expect(screen.getByText("Villa Rose")).toBeInTheDocument();
    expect(screen.getByText("Studio Blue")).toBeInTheDocument();
    // a month label somewhere in the header strip
    expect(screen.getAllByText(/june|july|august|2026/i).length).toBeGreaterThan(0);
  });

  it("renders without crashing when there are no bookings", () => {
    renderWithProviders(
      <TimelineView
        lodgings={lodgings}
        bookings={[]}
        settings={settings}
        defaultBeginDate={new Date("2026-06-01")}
      />,
      { user: { permissions: [] } }
    );
    expect(screen.getByText("Villa Rose")).toBeInTheDocument();
  });
});
