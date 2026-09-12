import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { NotificationPreferences } from "./NotificationPreferences";
import { NotificationPreference } from "../../types";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const preferences: NotificationPreference[] = [
  { name: "booking-added", display_name: "Booking added", backends: { noop: true, email: false } },
  { name: "subscription-added", display_name: "New subscription", backends: { noop: true } }
];

describe("NotificationPreferences", () => {
  beforeEach(() => {
    (axios as any).mockResolvedValue({ data: preferences, status: 200 });
  });

  it("renders one row per notification type with the available backend switches", async () => {
    renderWithProviders(<NotificationPreferences />, { user: {} });

    expect(await screen.findByText("Booking added")).toBeInTheDocument();
    expect(screen.getByText("New subscription")).toBeInTheDocument();

    // "Booking added" has both backends
    expect(screen.getByLabelText("Booking added - In-app")).toBeInTheDocument();
    expect(screen.getByLabelText("Booking added - Email")).toBeInTheDocument();

    // "New subscription" only offers noop - no email switch rendered
    expect(screen.getByLabelText("New subscription - In-app")).toBeInTheDocument();
    expect(screen.queryByLabelText("New subscription - Email")).not.toBeInTheDocument();
  });

  it("reflects each row's current state", async () => {
    renderWithProviders(<NotificationPreferences />, { user: {} });

    expect(await screen.findByLabelText("Booking added - In-app")).toBeChecked();
    expect(screen.getByLabelText("Booking added - Email")).not.toBeChecked();
  });

  it("saves the toggled backend when a switch is flipped", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationPreferences />, { user: {} });

    const emailSwitch = await screen.findByLabelText("Booking added - Email");
    await user.click(emailSwitch);

    const patchCall = (axios as any).mock.calls.find((call: any[]) => call[0].method?.toLowerCase() === "patch");
    expect(patchCall[0]).toMatchObject({
      url: expect.stringContaining("notification_preference/booking-added/"),
      data: { backends: { noop: true, email: true } }
    });
  });
});
