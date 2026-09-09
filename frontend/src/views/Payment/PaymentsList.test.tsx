import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import PaymentsList from "./PaymentsList";

vi.mock("axios");

const payments = {
  count: 1,
  results: [
    {
      id: 1,
      amount: 150,
      description: "Deposit",
      method: "transfer",
      date: "2026-06-01",
      checked: true,
      booking: { id: 5, guest_name: "John Traveller", lodgings: [{ id: 1, name: "Villa" }] },
    },
  ],
};

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    if (String(config?.url ?? "").includes("lodging")) return { data: { count: 0, results: [] }, status: 200 };
    return { data: payments, status: 200 };
  });
});
afterEach(() => vi.clearAllMocks());

describe("PaymentsList", () => {
  it("renders the payments grid with the guest name from the booking", async () => {
    renderWithProviders(<PaymentsList />, { user: { permissions: ["core.view_payment"] } });

    expect(await screen.findByText("John Traveller")).toBeInTheDocument();
    expect(screen.getByText("Deposit")).toBeInTheDocument();
  });

  it("renders several columns and the payment method", async () => {
    renderWithProviders(<PaymentsList />, { user: { permissions: ["core.view_payment"] } });
    await screen.findByText("John Traveller");
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(2);
    expect(screen.getByText("Transfer")).toBeInTheDocument();
  });
});
