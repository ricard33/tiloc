import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import SubscriptionCancel from "./SubscriptionCancel";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const activeAccount = {
  current_plan: { name: "Essential", interval: "monthly", price: 10 },
  current_subscription: { id: "sub_1", cancel_at_period_end: false },
  validity: new Date("2026-12-31"),
};

describe("SubscriptionCancel", () => {
  it("lists the premium features that would be lost and the current plan", () => {
    renderWithProviders(<SubscriptionCancel />, { account: activeAccount });
    expect(screen.getByText("Canceling your Subscription")).toBeInTheDocument();
    expect(screen.getByText("Essential")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel subscription" })).toBeInTheDocument();
  });

  it("shows an 'already canceled' notice when the subscription is set to end", () => {
    renderWithProviders(<SubscriptionCancel />, {
      account: { ...activeAccount, current_subscription: { id: "sub_1", cancel_at_period_end: true } },
    });
    expect(screen.getByText("Subscription already canceled")).toBeInTheDocument();
  });

  it("confirms then posts the cancellation", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    (axios.post as any).mockResolvedValue({ data: { id: "sub_1", cancel_at_period_end: true }, status: 200 });
    const user = userEvent.setup();
    renderWithProviders(<SubscriptionCancel />, { account: activeAccount, confirm });

    await user.click(screen.getByRole("button", { name: "Cancel subscription" }));

    expect(confirm).toHaveBeenCalled();
    await vi.waitFor(() =>
      expect((axios.post as any)).toHaveBeenCalledWith(expect.stringContaining("/subscription/sub_1/cancel/"))
    );
  });
});
