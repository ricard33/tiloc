import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import ChannelRevenue from "./ChannelRevenue";
import { ChannelRow } from "../types";

vi.mock("react-chartjs-2", () => ({ Chart: () => <div data-testid="chart" /> }));

const data: ChannelRow[] = [
  { channel: "airbnb", count: 3, turnover: 900 },
  { channel: null, count: 1, turnover: 200 },
];

describe("ChannelRevenue", () => {
  it("titles the card as revenue when the user can view prices", () => {
    renderWithProviders(<ChannelRevenue data={data} />, { user: { permissions: ["core.view_prices"] } });
    expect(screen.getByText("Revenue per channel")).toBeInTheDocument();
  });

  it("falls back to booking counts without view_prices", () => {
    renderWithProviders(<ChannelRevenue data={data} />, { user: { permissions: [] } });
    expect(screen.getByText("Bookings per channel")).toBeInTheDocument();
  });
});
