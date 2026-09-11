import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import CollectedVsOutstanding from "./CollectedVsOutstanding";
import { emptyPaymentsOverviewData } from "../types";

describe("CollectedVsOutstanding", () => {
  it("renders formatted collected and outstanding amounts", () => {
    renderWithProviders(
      <CollectedVsOutstanding data={{ ...emptyPaymentsOverviewData, total_collected: 1500, total_outstanding: 250 }} />,
      { user: { permissions: ["core.view_prices"] } }
    );

    expect(screen.getByText("Collected")).toBeInTheDocument();
    expect(screen.getByText("Outstanding balance")).toBeInTheDocument();
  });
});
