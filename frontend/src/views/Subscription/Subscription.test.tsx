import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import Subscription from "./Subscription";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const account = (sub: Record<string, unknown> | null) => ({
  current_plan: { name: "Essential", interval: "monthly", price: 10 },
  current_subscription: sub,
  validity: new Date("2026-12-31"),
});

describe("Subscription", () => {
  it("shows the plan details and a Cancel link for an active subscription", () => {
    renderWithProviders(<Subscription />, {
      account: account({ id: "sub_1", status: "active", cancel_at_period_end: false }),
    });
    expect(screen.getByText("Essential")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Cancel subscription" })).toHaveAttribute("href", "/cancel");
  });

  it("offers Reactivate when the subscription is set to cancel", () => {
    renderWithProviders(<Subscription />, {
      account: account({ id: "sub_1", status: "active", cancel_at_period_end: true }),
    });
    expect(screen.getByRole("button", { name: "Reactivate subscription" })).toBeInTheDocument();
  });

  it("shows 'no active subscription' otherwise", () => {
    renderWithProviders(<Subscription />, { account: account(null) });
    expect(screen.getByText("No active subscription")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Subscribe plan" })).toBeInTheDocument();
  });

  it("reactivates the subscription after confirmation", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    (axios.post as any).mockResolvedValue({ data: {}, status: 200 });
    const user = userEvent.setup();
    renderWithProviders(<Subscription />, {
      account: account({ id: "sub_1", status: "active", cancel_at_period_end: true }),
      confirm,
    });

    await user.click(screen.getByRole("button", { name: "Reactivate subscription" }));

    expect(confirm).toHaveBeenCalled();
    await vi.waitFor(() =>
      expect((axios.post as any)).toHaveBeenCalledWith(expect.stringContaining("/subscription/sub_1/reactivate/"))
    );
  });
});
