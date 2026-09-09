import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../../../common/testRender";
import UpgradePlan from "./UpgradePlan";

describe("UpgradePlan", () => {
  it("promotes the PRO plan and links to /upgrade-plan", () => {
    renderWithProviders(<UpgradePlan />);
    expect(screen.getByText("Upgrade to PRO")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade" })).toHaveAttribute("href", "/upgrade-plan");
  });
});
