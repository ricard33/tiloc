import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentList from "./PaymentList";
import { renderWithProviders } from "../common/testRender";
import type { Payment } from "../types";

const payments = [
  { id: 1, description: "Deposit", amount: 120, method: "transfer", date: new Date("2024-06-01") },
  { id: 2, description: "Balance", amount: 80.5, method: "cash", date: new Date("2024-07-15") },
] as unknown as Payment[];

describe("PaymentList", () => {
  it("renders a row per payment with the translated method and the total", () => {
    renderWithProviders(<PaymentList payments={payments} />);

    expect(screen.getByText("Deposit")).toBeInTheDocument();
    expect(screen.getByText("Transfer")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    // total row: 120 + 80.5 (DecimalPrecision.round keeps 2 decimals)
    expect(screen.getByText(/200\.5 €/)).toBeInTheDocument();
  });

  it("wires the edit and delete callbacks", async () => {
    const onModify = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<PaymentList payments={payments} onModify={onModify} onDelete={onDelete} />);

    await user.click(screen.getAllByRole("button", { name: "edit" })[0]);
    await user.click(screen.getAllByRole("button", { name: "delete" })[1]);

    expect(onModify).toHaveBeenCalledWith(payments[0]);
    expect(onDelete).toHaveBeenCalledWith(payments[1]);
  });

  it("shows no action buttons when no callbacks are given", () => {
    renderWithProviders(<PaymentList payments={payments} />);
    expect(screen.queryByRole("button", { name: "edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "delete" })).not.toBeInTheDocument();
  });
});
