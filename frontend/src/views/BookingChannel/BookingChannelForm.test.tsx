import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../common/testRender";
import { BookingChannelForm } from "./BookingChannelForm";
import type { BookingChannel } from "../../types";

const channel = { id: 2, name: "Airbnb", read_only: false } as BookingChannel;

describe("BookingChannelForm", () => {
  it("pre-fills the name and shows Close until edited", () => {
    renderWithProviders(
      <BookingChannelForm bookingChannel={channel} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByDisplayValue("Airbnb")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("submits the edited channel", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<BookingChannelForm bookingChannel={channel} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.clear(screen.getByLabelText(/Name/));
    await user.type(screen.getByLabelText(/Name/), "Booking.com");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: "Booking.com" });
  });

  it("calls onDelete with the channel", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <BookingChannelForm bookingChannel={channel} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={onDelete} />
    );
    await user.click(screen.getByRole("button", { name: /Delete/ }));
    expect(onDelete).toHaveBeenCalledWith(channel);
  });
});
