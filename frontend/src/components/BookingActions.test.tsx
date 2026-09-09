import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import BookingActions from "./BookingActions";
import { renderWithProviders } from "../common/testRender";
import type { Booking } from "../types";

vi.mock("axios");

const booking = {
  id: 5,
  cancelled: false,
  guest_name: "Doe",
  lodgings: [{ name: "Villa" }],
  daily_rate: 100,
  price: 700,
  deposit: 200,
  guaranty: 300,
  commission_fees: 0,
} as unknown as Booking;

const noop = { onCancelBooking: vi.fn(), onUncancelBooking: vi.fn() };

const perms = ["core.change_booking", "core.delete_booking", "core.view_contract"];

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: booking, status: 200 })));
afterEach(() => vi.clearAllMocks());

describe("BookingActions", () => {
  it("calls onEdit from the edit button", async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<BookingActions booking={booking} onEdit={onEdit} {...noop} />, {
      user: { id: 1, permissions: perms },
    });

    await user.click(screen.getByRole("button", { name: "edit" }));
    expect(onEdit).toHaveBeenCalled();
  });

  it("shows a Save button while dirty and calls onSave(true)", async () => {
    const onSave = vi.fn().mockResolvedValue(booking);
    const user = userEvent.setup();
    renderWithProviders(
      <BookingActions booking={booking} isDirty onSave={onSave} onReset={vi.fn()} {...noop} />,
      { user: { id: 1, permissions: perms } }
    );

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSave).toHaveBeenCalledWith(true);
  });

  it("moves to the confirm/discard step when Cancel is clicked, and back on Discard", async () => {
    const user = userEvent.setup();
    renderWithProviders(<BookingActions booking={booking} {...noop} />, {
      user: { id: 1, permissions: perms },
    });

    await user.click(screen.getByRole("button", { name: "cancel" }));

    expect(screen.getByRole("button", { name: /Confirm cancellation/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Discard/ }));
    expect(screen.queryByRole("button", { name: /Confirm cancellation/ })).not.toBeInTheDocument();
  });

  it("runs the cancel flow (confirm dialog + onCancelBooking) on Confirm cancellation", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    const onCancelBooking = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <BookingActions booking={booking} onCancelBooking={onCancelBooking} onUncancelBooking={vi.fn()} />,
      { user: { id: 1, permissions: perms }, confirm }
    );

    await user.click(screen.getByRole("button", { name: "cancel" }));
    await user.click(screen.getByRole("button", { name: /Confirm cancellation/ }));

    expect(confirm).toHaveBeenCalled();
    await vi.waitFor(() => expect(onCancelBooking).toHaveBeenCalled());
  });

  it("offers 'book again' for a cancelled booking", async () => {
    const onUncancelBooking = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <BookingActions
        booking={{ ...booking, cancelled: true } as Booking}
        onCancelBooking={vi.fn()}
        onUncancelBooking={onUncancelBooking}
      />,
      { user: { id: 1, permissions: perms } }
    );

    await user.click(screen.getByRole("button", { name: "book again" }));
    await vi.waitFor(() => expect(onUncancelBooking).toHaveBeenCalled());
  });
});
