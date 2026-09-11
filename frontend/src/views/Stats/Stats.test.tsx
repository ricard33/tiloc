import React from "react";
import { screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import Stats from "./Stats";
import { emptyBookingFunnelData, emptyPaymentsOverviewData } from "./types";

vi.mock("axios");
vi.mock("react-chartjs-2", () => ({
  Chart: () => <div data-testid="chart" />,
  Doughnut: () => <div data-testid="doughnut" />,
}));

beforeEach(() => {
  (axios as any).mockResolvedValue({ data: { count: 0, results: [] }, status: 200 });
  (axios.get as any).mockImplementation((url: string) => {
    if (url.startsWith("/stats/booking_funnel/")) return Promise.resolve({ data: emptyBookingFunnelData });
    if (url.startsWith("/stats/payments_overview/")) return Promise.resolve({ data: emptyPaymentsOverviewData });
    if (url.startsWith("/stats/season_breakdown/")) return Promise.resolve({ data: {} });
    return Promise.resolve({ data: [] }); // filling_rate, channel_distribution
  });
});
afterEach(() => vi.clearAllMocks());

describe("Stats", () => {
  it("fetches every theme endpoint for the default range", async () => {
    renderWithProviders(<Stats />, { user: { permissions: ["core.view_prices"] } });

    await waitFor(() => {
      const urls = (axios.get as any).mock.calls.map(([url]: string[]) => url);
      expect(urls.some((u: string) => u.startsWith("/stats/filling_rate/"))).toBe(true);
      expect(urls.some((u: string) => u.startsWith("/stats/channel_distribution/"))).toBe(true);
      expect(urls.some((u: string) => u.startsWith("/stats/booking_funnel/"))).toBe(true);
      expect(urls.some((u: string) => u.startsWith("/stats/season_breakdown/"))).toBe(true);
      expect(urls.some((u: string) => u.startsWith("/stats/payments_overview/"))).toBe(true);
    });
  });

  it("does not request payments_overview without view_prices, and hides the payments cards", async () => {
    renderWithProviders(<Stats />, { user: { permissions: [] } });

    await screen.findByText("Bookings by status");
    const urls = (axios.get as any).mock.calls.map(([url]: string[]) => url);
    expect(urls.some((u: string) => u.startsWith("/stats/payments_overview/"))).toBe(false);
    expect(screen.queryByText("Payments by method")).not.toBeInTheDocument();
    expect(screen.queryByText("Collected")).not.toBeInTheDocument();
  });
});
