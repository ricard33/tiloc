import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../common/testRender";
import SettingsIndex from "./SettingsIndex";

const account = (over = {}) => ({ current_plan: { max_users: 1 }, trial_is_over: false, ...over });

describe("SettingsIndex", () => {
  it("shows the settings navigation cards", () => {
    renderWithProviders(<SettingsIndex />, { user: { permissions: [] }, account: account() });

    expect(screen.getByRole("link", { name: /My account/ })).toHaveAttribute("href", "/account");
    expect(screen.getByRole("link", { name: /Lodgings/ })).toHaveAttribute("href", "/lodgings");
    expect(screen.getByRole("link", { name: /Services/ })).toHaveAttribute("href", "/services");
    expect(screen.getByRole("link", { name: /Booking channels/ })).toHaveAttribute("href", "/booking-channels");
  });

  it("hides the Users card unless the plan allows several users", () => {
    renderWithProviders(<SettingsIndex />, {
      user: { permissions: ["core.view_user"] },
      account: account({ current_plan: { max_users: 1 } }),
    });
    expect(screen.queryByRole("link", { name: /Users/ })).not.toBeInTheDocument();

    renderWithProviders(<SettingsIndex />, {
      user: { permissions: ["core.view_user"] },
      account: account({ current_plan: { max_users: 10 } }),
    });
    expect(screen.getByRole("link", { name: /Users/ })).toBeInTheDocument();
  });

  it("routes the calendar-sync card to the upgrade screen once the trial is over", () => {
    renderWithProviders(<SettingsIndex />, {
      user: { permissions: [] },
      account: account({ trial_is_over: true }),
    });
    expect(screen.getByRole("link", { name: /Calendars sync/ })).toHaveAttribute("href", "/upgrade-plan");
  });
});
