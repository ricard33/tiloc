import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import ActivityFeed from "./ActivityFeed";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const booking = {
  id: 5,
  guest_name: "John Traveller",
  lodgings: [{ id: 1, name: "Villa" }],
  begin_date: "2026-07-01",
  end_date: "2026-07-08",
  source: null,
  status: "paid",
  created: "2026-01-01",
  modified: "2026-01-01",
};

const activities = {
  count: 1,
  results: [{ id: 10, type: "add_booking", date: "2026-06-30", booking }],
};

describe("ActivityFeed", () => {
  it("renders a labelled timeline item per activity", async () => {
    (axios as any).mockResolvedValue({ data: activities, status: 200 });
    renderWithProviders(<ActivityFeed />, { user: { permissions: [] } });

    expect(await screen.findByText("Activity Feed")).toBeInTheDocument();
    expect(await screen.findByText(/John Traveller/)).toBeInTheDocument();
    expect(screen.getByText(/Villa/)).toBeInTheDocument();
  });

  it("shows an empty state when there is no activity", async () => {
    (axios as any).mockResolvedValue({ data: { count: 0, results: [] }, status: 200 });
    renderWithProviders(<ActivityFeed />, { user: { permissions: [] } });

    expect(await screen.findByText(/no recent activity/)).toBeInTheDocument();
  });
});
