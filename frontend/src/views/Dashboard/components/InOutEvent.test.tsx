import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import InOutEvent from "./InOutEvent";
import type { NextEvent } from "../../../types";

vi.mock("axios");
beforeEach(() => (axios as any).mockResolvedValue({ data: { count: 0, results: [] }, status: 200 }));
afterEach(() => vi.clearAllMocks());

const event = {
  id: 1,
  event_type: "CHECKOUT",
  date: new Date("2026-07-08"),
  guest_name: "John Traveller",
  guests: 3,
  duration: 7,
  lodgings: [{ id: 1, name: "Villa" }],
  status: "paid",
  price: 700,
} as unknown as NextEvent;

describe("InOutEvent", () => {
  it("renders the departure line with the lodging, guests and guest name", () => {
    renderWithProviders(<InOutEvent event={event} />, { user: { permissions: [] } });
    expect(screen.getByText("departure")).toBeInTheDocument();
    expect(screen.getByText(/Villa/)).toBeInTheDocument();
    expect(screen.getByText(/John Traveller/)).toBeInTheDocument();
  });

  it("reveals the booking tooltip on hover", async () => {
    const user = userEvent.setup();
    renderWithProviders(<InOutEvent event={event} />, { user: { permissions: ["core.view_booking"] } });

    await user.hover(screen.getByText("departure"));
    // BookingTooltip shows the guest name inside a tooltip
    expect(await screen.findAllByText(/John Traveller/)).not.toHaveLength(0);
  });
});
