import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentDialog from "./PaymentDialog";
import { renderWithProviders } from "../common/testRender";
import type { Payment } from "../types";

const blankPayment = {
  booking_id: 5,
  date: new Date("2024-06-01"),
  description: "",
  method: "",
  amount: 0,
  checked: false,
} as Omit<Payment, "booking">;

describe("PaymentDialog", () => {
  it("shows the 'Add payment' title and button for a new payment", () => {
    renderWithProviders(
      <PaymentDialog payment={blankPayment} bookingId={5} onValidate={vi.fn()} onClose={vi.fn()} />
    );
    expect(screen.getByText("Add payment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("shows the 'Modify payment' title for an existing payment", () => {
    renderWithProviders(
      <PaymentDialog
        payment={{ ...blankPayment, id: 9, description: "Deposit", method: "cash", amount: 100 }}
        bookingId={5}
        onValidate={vi.fn()}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Modify payment")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("blocks submission and shows errors while required fields are empty", async () => {
    const onValidate = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PaymentDialog payment={blankPayment} bookingId={5} onValidate={onValidate} onClose={vi.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("The description is required")).toBeInTheDocument();
    expect(onValidate).not.toHaveBeenCalled();
  });

  it("submits a numeric amount once the required fields are filled", async () => {
    const onValidate = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PaymentDialog payment={blankPayment} bookingId={5} onValidate={onValidate} onClose={vi.fn()} />
    );

    await user.type(screen.getByLabelText("description"), "Balance");
    await user.type(screen.getByLabelText("amount"), "250");

    // MUI select for the payment method
    await user.click(screen.getByLabelText("payment method"));
    await user.click(await screen.findByRole("option", { name: "Transfer" }));

    await user.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(onValidate).toHaveBeenCalled());
    expect(onValidate.mock.calls[0][0]).toMatchObject({ description: "Balance", method: "transfer", amount: 250 });
    expect(typeof onValidate.mock.calls[0][0].amount).toBe("number");
  });

  it("calls onClose from the Cancel button", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <PaymentDialog payment={blankPayment} bookingId={5} onValidate={vi.fn()} onClose={onClose} />
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
