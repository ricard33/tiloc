import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import TouristTaxAndGuests from "./TouristTaxAndGuests";
import { emptyPaymentsOverviewData } from "../types";

describe("TouristTaxAndGuests", () => {
  it("renders the tourist tax and guests tiles", () => {
    renderWithProviders(
      <TouristTaxAndGuests data={{ ...emptyPaymentsOverviewData, total_tourist_tax: 42, total_guests: 6 }} />,
      { user: { permissions: ["core.view_prices"] } }
    );

    expect(screen.getByText("Tourist tax collected")).toBeInTheDocument();
    expect(screen.getByText("Guests hosted")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });
});
