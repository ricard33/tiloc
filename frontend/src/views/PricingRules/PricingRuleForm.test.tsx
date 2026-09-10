import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../common/testRender";
import { PricingRuleForm } from "./PricingRuleForm";
import type { Lodging, PricingAdjustment } from "../../types";

const lodgings = [{ id: 3, name: "Villa Rose", daily_rate: 100 }] as unknown as Lodging[];

describe("PricingRuleForm", () => {
  it("applies the last-minute preset and submits the normalised payload", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderWithProviders(
      <PricingRuleForm lodgings={lodgings} onSubmit={onSubmit} onCancel={() => {}} />,
      { user: { permissions: [] } }
    );

    await user.type(screen.getByRole("textbox", { name: /Name/ }), "Promo");
    await user.click(screen.getByRole("button", { name: "Last minute" }));
    expect(screen.getByRole("spinbutton", { name: "Max days before arrival" })).toHaveValue(30);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0] as PricingAdjustment;
    expect(payload.name).toBe("Promo");
    expect(payload.max_days_before_arrival).toBe(30);
    expect(payload.adjustment_type).toBe("percent");
  });

  it("shows Save/Delete for an existing rule", () => {
    const rule = {
      id: 1, name: "Cleaning", lodging: null, adjustment_type: "fixed", value: 45,
      priority: 0, stackable: true, active: true, applicable_weekdays: []
    } as unknown as PricingAdjustment;
    renderWithProviders(
      <PricingRuleForm rule={rule} lodgings={lodgings} onSubmit={vi.fn()} onCancel={() => {}} onDelete={vi.fn()} />,
      { user: { permissions: [] } }
    );
    expect(screen.getByDisplayValue("Cleaning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
