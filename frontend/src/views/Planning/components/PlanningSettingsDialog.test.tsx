import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../common/testRender";
import PlanningSettingsDialog, {
  loadPlanningSettings,
  savePlanningSettings,
} from "./PlanningSettingsDialog";

beforeEach(() => localStorage.clear());

describe("planning settings persistence", () => {
  it("loadPlanningSettings returns the defaults with an empty storage", () => {
    expect(loadPlanningSettings()).toEqual({
      monthsToDisplay: 12,
      showPaymentStatus: true,
      showPrices: true,
      anonymized: false,
    });
  });

  it("savePlanningSettings + loadPlanningSettings round-trips", () => {
    savePlanningSettings({ monthsToDisplay: 6, showPaymentStatus: false, showPrices: true, anonymized: false });
    const loaded = loadPlanningSettings();
    expect(loaded.monthsToDisplay).toEqual(6);
    expect(loaded.showPaymentStatus).toEqual(false);
    expect(loaded.showPrices).toEqual(true);
  });
});

describe("PlanningSettingsDialog", () => {
  const settings = { monthsToDisplay: 12, showPaymentStatus: true, showPrices: false, anonymized: false };

  it("renders the settings form when open", () => {
    renderWithProviders(<PlanningSettingsDialog open settings={settings} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Save/ })).toBeInTheDocument();
  });

  it("calls onClose with no argument when cancelled", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PlanningSettingsDialog open settings={settings} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(onClose).toHaveBeenCalledWith();
  });

  it("saves and returns the settings on submit", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PlanningSettingsDialog open settings={settings} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: /Save/ }));
    expect(onClose).toHaveBeenCalledWith(expect.objectContaining({ monthsToDisplay: expect.anything() }));
  });
});
