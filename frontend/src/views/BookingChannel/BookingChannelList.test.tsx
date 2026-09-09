import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import BookingChannelList from "./BookingChannelList";

vi.mock("axios");

const channels = {
  count: 2,
  results: [
    { id: 1, name: "Airbnb", read_only: true },
    { id: 2, name: "My website", read_only: false },
  ],
};

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: channels, status: 200 })));
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/booking-channels" element={<BookingChannelList />} />
    <Route path="/booking-channels/new" element={<div>new channel</div>} />
    <Route path="/booking-channels/:id" element={<div>channel detail</div>} />
  </Routes>
);

describe("BookingChannelList", () => {
  it("lists the channels", async () => {
    renderWithProviders(routes, { route: "/booking-channels", user: { permissions: ["core.view_bookingchannel"] } });
    expect(await screen.findByText("Airbnb")).toBeInTheDocument();
    expect(screen.getByText("My website")).toBeInTheDocument();
  });

  it("opens an editable channel but not a read-only one", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, { route: "/booking-channels", user: { permissions: ["core.view_bookingchannel"] } });

    await user.click(await screen.findByText("Airbnb")); // read_only -> no navigation
    expect(screen.queryByText("channel detail")).not.toBeInTheDocument();

    await user.click(screen.getByText("My website"));
    expect(await screen.findByText("channel detail")).toBeInTheDocument();
  });
});
