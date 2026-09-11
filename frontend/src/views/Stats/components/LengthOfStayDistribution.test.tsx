import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import LengthOfStayDistribution from "./LengthOfStayDistribution";
import { emptyBookingFunnelData } from "../types";

vi.mock("react-chartjs-2", () => ({ Chart: () => <div data-testid="chart" /> }));

describe("LengthOfStayDistribution", () => {
  it("renders the length-of-stay histogram card", () => {
    renderWithProviders(
      <LengthOfStayDistribution
        data={{ ...emptyBookingFunnelData, length_of_stay_distribution: [{ label: "7-13", count: 4 }] }}
      />,
      { user: { permissions: [] } }
    );

    expect(screen.getByText("Length of stay (nights)")).toBeInTheDocument();
    expect(screen.getByTestId("chart")).toBeInTheDocument();
  });
});
