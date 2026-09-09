import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Payments from "./Payments";
import { renderWithProviders } from "../common/testRender";
import { paymentsList } from "../services/testData";

vi.mock("axios");

beforeEach(() => {
  (axios as any).mockImplementation(async () => ({ data: paymentsList, status: 200 }));
});
afterEach(() => vi.clearAllMocks());

describe("Payments", () => {
  it("renders nothing without the view_payment permission", () => {
    renderWithProviders(<Payments bookingId={22} />, { user: { permissions: [] } });
    expect(screen.queryByText("Add payment")).not.toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("lists the booking payments and an 'Add payment' action", async () => {
    renderWithProviders(<Payments bookingId={22} />, { user: { permissions: ["core.view_payment"] } });

    expect(await screen.findByText("Add payment")).toBeInTheDocument();
    expect(await screen.findByText("Cash")).toBeInTheDocument();
  });

  it("opens the payment dialog when 'Add payment' is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Payments bookingId={22} />, { user: { permissions: ["core.view_payment"] } });

    await user.click(await screen.findByText("Add payment"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Add payment")).toBeInTheDocument();
  });

  it("asks for confirmation before deleting a payment", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined); // user accepts
    const user = userEvent.setup();
    renderWithProviders(<Payments bookingId={22} />, {
      user: { permissions: ["core.view_payment"] },
      confirm,
    });

    await screen.findByText("Cash");
    // row delete buttons come before the "Add payment" button, which also has aria-label="delete"
    await user.click(screen.getAllByRole("button", { name: "delete" })[0]);

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining("permanently delete") })
    );
  });
});
