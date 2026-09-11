import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import BookingFunnel from "./BookingFunnel";
import { emptyBookingFunnelData } from "../types";

vi.mock("react-chartjs-2", () => ({ Chart: () => <div data-testid="chart" /> }));

describe("BookingFunnel", () => {
  it("renders the funnel chart card", () => {
    renderWithProviders(
      <BookingFunnel data={{ ...emptyBookingFunnelData, funnel: [{ status: "option", count: 3 }] }} />,
      { user: { permissions: [] } }
    );

    expect(screen.getByText("Bookings by status")).toBeInTheDocument();
    expect(screen.getByTestId("booking-funnel-chart")).toBeInTheDocument();
  });
});
