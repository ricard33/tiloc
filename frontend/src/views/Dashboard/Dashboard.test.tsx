import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import Dashboard from "./Dashboard";

vi.mock("axios");

// the heavy chart panels are lazy-loaded — stub them
vi.mock("./components/FillingRate", () => ({ default: () => <div>filling rate chart</div> }));
vi.mock("./components/ChannelsDistribution", () => ({ default: () => <div>channels chart</div> }));

beforeEach(() => (axios as any).mockResolvedValue({ data: [], status: 200 }));
afterEach(() => vi.clearAllMocks());

describe("Dashboard", () => {
  it("lays out the next-events, activity feed and (lazy) chart panels", async () => {
    renderWithProviders(<Dashboard />, { user: { permissions: [] } });

    expect(screen.getByText("Next arrivals / departures")).toBeInTheDocument();
    expect(screen.getByText("Activity Feed")).toBeInTheDocument();
    expect(await screen.findByText("filling rate chart")).toBeInTheDocument();
    expect(await screen.findByText("channels chart")).toBeInTheDocument();
  });
});
