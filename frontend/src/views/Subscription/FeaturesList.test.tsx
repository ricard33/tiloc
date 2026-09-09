import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../common/testRender";
import FeaturesList from "./FeaturesList";

describe("FeaturesList", () => {
  it("renders each feature with an availability icon or a count", () => {
    renderWithProviders(
      <FeaturesList
        features={[
          { label: "Calendar sync", available: true },
          { label: "Block bookings", available: false },
          { label: "Lodgings", count: 3 },
        ]}
      />
    );

    expect(screen.getByText("Calendar sync")).toBeInTheDocument();
    expect(screen.getByText("Block bookings")).toBeInTheDocument();
    expect(screen.getByTestId("CheckCircleOutlineIcon")).toBeInTheDocument();
    expect(screen.getByTestId("HighlightOffIcon")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
