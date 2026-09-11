import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import ConversionTiles from "./ConversionTiles";
import { emptyBookingFunnelData } from "../types";

describe("ConversionTiles", () => {
  it("renders formatted rates and durations", () => {
    renderWithProviders(
      <ConversionTiles
        data={{
          ...emptyBookingFunnelData,
          cancellation_rate: 12.5,
          signature_rate: 80,
          average_length_of_stay: 7,
          average_lead_time: 21,
        }}
      />,
      { user: { permissions: [] } }
    );

    expect(screen.getByText("12.5 %")).toBeInTheDocument();
    expect(screen.getByText("80 %")).toBeInTheDocument();
    expect(screen.getByText("7 nights")).toBeInTheDocument();
    expect(screen.getByText("21 days")).toBeInTheDocument();
  });

  it("shows a placeholder for null rates instead of crashing", () => {
    renderWithProviders(<ConversionTiles data={emptyBookingFunnelData} />, { user: { permissions: [] } });

    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
