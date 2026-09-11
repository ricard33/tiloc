import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../../common/testRender";
import PaymentMethods from "./PaymentMethods";
import { emptyPaymentsOverviewData } from "../types";

vi.mock("react-chartjs-2", () => ({ Doughnut: () => <div data-testid="doughnut" /> }));

describe("PaymentMethods", () => {
  it("renders the payment methods doughnut", () => {
    renderWithProviders(
      <PaymentMethods
        data={{ ...emptyPaymentsOverviewData, payment_methods: [{ method: "transfer", count: 2, total: 300 }] }}
      />,
      { user: { permissions: ["core.view_prices"] } }
    );

    expect(screen.getByText("Payments by method")).toBeInTheDocument();
    expect(screen.getByTestId("doughnut")).toBeInTheDocument();
  });
});
