import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import OccupancyAndRevenue from "./OccupancyAndRevenue";
import { FillingRateRow } from "../types";

vi.mock("react-chartjs-2", () => ({ Chart: () => <div data-testid="chart" /> }));

const data: FillingRateRow[] = [
  { date: "2030-01", days: 10, capacity: 20, rate: 50, turnover: 1000 },
];

describe("OccupancyAndRevenue", () => {
  it("shows occupancy and revenue tiles/charts for a user with view_prices", () => {
    renderWithProviders(<OccupancyAndRevenue data={data} previousYearData={[]} />, {
      user: { permissions: ["core.view_prices"] },
    });

    expect(screen.getByText("Average daily rate")).toBeInTheDocument();
    expect(screen.getByText("RevPAR")).toBeInTheDocument();
    expect(screen.getByText("Turnover")).toBeInTheDocument();
    expect(screen.getAllByTestId("chart")).toHaveLength(2);
  });

  it("hides money figures without view_prices", () => {
    renderWithProviders(<OccupancyAndRevenue data={data} previousYearData={[]} />, {
      user: { permissions: [] },
    });

    expect(screen.queryByText("Average daily rate")).not.toBeInTheDocument();
    expect(screen.queryByText("RevPAR")).not.toBeInTheDocument();
    expect(screen.queryByText("Turnover")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("chart")).toHaveLength(1);
  });
});
