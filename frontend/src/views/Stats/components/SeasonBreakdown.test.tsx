import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import SeasonBreakdown from "./SeasonBreakdown";
import { SeasonBreakdownData } from "../types";

vi.mock("react-chartjs-2", () => ({ Chart: () => <div data-testid="chart" /> }));

const data: SeasonBreakdownData = {
  High: { days: 30, bookings: 4, turnover: 3000 },
  unassigned: { days: 5, bookings: 1, turnover: 200 },
};

describe("SeasonBreakdown", () => {
  it("renders the season breakdown chart", () => {
    renderWithProviders(<SeasonBreakdown data={data} />, { user: { permissions: ["core.view_prices"] } });
    expect(screen.getByText("Revenue by season")).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });

  it("renders without turnover data when the user lacks view_prices", () => {
    renderWithProviders(<SeasonBreakdown data={data} />, { user: { permissions: [] } });
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });
});
