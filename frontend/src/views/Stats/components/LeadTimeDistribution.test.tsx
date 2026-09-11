import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import LeadTimeDistribution from "./LeadTimeDistribution";
import { emptyBookingFunnelData } from "../types";

vi.mock("react-chartjs-2", () => ({ Chart: () => <div data-testid="chart" /> }));

describe("LeadTimeDistribution", () => {
  it("renders the lead-time histogram card", () => {
    renderWithProviders(
      <LeadTimeDistribution data={{ ...emptyBookingFunnelData, lead_time_distribution: [{ label: "8-30", count: 2 }] }} />,
      { user: { permissions: [] } }
    );

    expect(screen.getByText("Booking lead time (days)")).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });
});
