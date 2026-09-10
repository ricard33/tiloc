import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import PricingRulesList from "./PricingRulesList";

vi.mock("axios");

const rules = {
  count: 2,
  results: [
    { id: 1, name: "Last minute", lodging: null, adjustment_type: "percent", value: "-15.00", priority: 0, stackable: true, active: true },
    { id: 2, name: "Cleaning fee", lodging: 3, adjustment_type: "fixed", value: "45.00", priority: 5, stackable: true, active: true }
  ]
};
const lodgings = { count: 1, results: [{ id: 3, name: "Villa Rose", daily_rate: 100 }] };

beforeEach(() => (axios as any).mockImplementation(async (config: any) => ({
  data: String(config?.url).includes("lodging/") ? lodgings : rules,
  status: 200
})));
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/settings/pricing-rules" element={<PricingRulesList />} />
    <Route path="/settings/pricing-rules/:ruleId" element={<div>rule detail</div>} />
  </Routes>
);

describe("PricingRulesList", () => {
  it("lists the rules with their scope and opens one", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: "/settings/pricing-rules",
      user: { permissions: ["core.view_pricingadjustment"] }
    });
    expect(await screen.findByText("Last minute")).toBeInTheDocument();
    expect(await screen.findByText("All lodgings")).toBeInTheDocument();
    expect(await screen.findByText("Villa Rose")).toBeInTheDocument();

    await user.click(screen.getByText("Last minute"));
    expect(await screen.findByText("rule detail")).toBeInTheDocument();
  });
});
