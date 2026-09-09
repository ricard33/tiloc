import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import ChannelsDistribution from "./ChannelsDistribution";

vi.mock("axios");
vi.mock("react-chartjs-2", () => ({ Doughnut: () => <div data-testid="doughnut" /> }));

afterEach(() => vi.clearAllMocks());

describe("ChannelsDistribution", () => {
  it("fetches the channel distribution and renders the chart card", async () => {
    (axios.get as any).mockResolvedValue({
      data: [
        { channel: "Airbnb", count: 12 },
        { channel: "Direct", count: 5 },
      ],
    });

    renderWithProviders(<ChannelsDistribution />, { user: { permissions: [] } });

    expect(await screen.findByTestId("doughnut")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("stats/channel_distribution/");
  });

  it("refetches when the refresh button is clicked", async () => {
    (axios.get as any).mockResolvedValue({ data: [] });
    const user = userEvent.setup();
    renderWithProviders(<ChannelsDistribution />, { user: { permissions: [] } });
    await screen.findByTestId("doughnut");

    (axios.get as any).mockClear();
    await user.click(screen.getByRole("button"));
    expect(axios.get).toHaveBeenCalledWith("stats/channel_distribution/");
  });
});
