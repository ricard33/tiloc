import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import PricingTable from "./PricingTable";

vi.mock("axios");
beforeEach(() => (axios.get as any).mockResolvedValue({ data: {} }));
afterEach(() => vi.clearAllMocks());

describe("PricingTable", () => {
  it("renders the three plans and a monthly/yearly toggle", () => {
    renderWithProviders(<PricingTable />, { account: { current_plan: { ref: "FREE" } } });
    expect(screen.getByText("Basic")).toBeInTheDocument();
    expect(screen.getByText("Essential")).toBeInTheDocument();
    expect(screen.getByText("Professional")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument(); // the interval switch
  });

  it("marks the account's current plan and offers Subscribe on the others", () => {
    renderWithProviders(<PricingTable />, {
      account: { current_plan: { ref: "FREE" }, current_subscription: null },
    });
    expect(screen.getAllByText("Current plan").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Subscribe" }).length).toBeGreaterThan(0);
  });

  it("switches prices to yearly", async () => {
    const user = userEvent.setup();
    renderWithProviders(<PricingTable />, { account: { current_plan: { ref: "FREE" } } });

    expect(screen.getAllByText("month").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getAllByText("year").length).toBeGreaterThan(0);
    expect(screen.queryAllByText("month")).toHaveLength(0);
  });
});
