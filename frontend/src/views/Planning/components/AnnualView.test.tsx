import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import AnnualView from "./AnnualView";
import type { Booking, Lodging } from "../../../types";

vi.mock("axios");
beforeEach(() => (axios as any).mockResolvedValue({ data: { count: 0, results: [] }, status: 200 }));
afterEach(() => vi.clearAllMocks());

const lodgings = [
  { id: 1, name: "Villa Rose", rank: 1 },
  { id: 2, name: "Studio Blue", rank: 2 },
] as unknown as Lodging[];

const settings = { monthsToDisplay: 12, showPaymentStatus: true, showPrices: false, anonymized: false };

describe("AnnualView", () => {
  it("renders the lodging rows across the year", () => {
    renderWithProviders(
      <AnnualView
        lodgings={lodgings}
        bookings={[] as Booking[]}
        settings={settings}
        beginDate={new Date("2026-01-01")}
        disabled={false}
      />,
      { user: { permissions: [] } }
    );
    expect(screen.getAllByText("Villa Rose").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Studio Blue").length).toBeGreaterThan(0);
  });
});
