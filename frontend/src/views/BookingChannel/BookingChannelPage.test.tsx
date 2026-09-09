import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { BookingChannelPage } from "./BookingChannelPage";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/booking-channels/new" element={<BookingChannelPage />} />
    <Route path="/booking-channels" element={<div>channels list</div>} />
  </Routes>
);

describe("BookingChannelPage", () => {
  it("renders the channel form in create mode", () => {
    renderWithProviders(routes, {
      route: ["/booking-channels", "/booking-channels/new"],
      user: { permissions: ["core.add_bookingchannel"] },
    });
    expect(screen.getByText("Booking channel properties")).toBeInTheDocument();
  });

  it("creates the channel and returns to the list", async () => {
    (axios as any).mockResolvedValue({ data: { id: 4, name: "Vrbo" }, status: 201 });
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: ["/booking-channels", "/booking-channels/new"],
      user: { permissions: ["core.add_bookingchannel", "core.change_bookingchannel"] },
    });

    await user.type(screen.getByLabelText(/Name/), "Vrbo");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("channels list")).toBeInTheDocument();
  });
});
