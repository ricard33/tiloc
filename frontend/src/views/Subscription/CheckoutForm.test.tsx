import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../common/testRender";
import CheckoutForm from "./CheckoutForm";

vi.mock("axios");

const stripe = { confirmPayment: vi.fn(), confirmSetup: vi.fn() };
const elements = { submit: vi.fn(), getElement: vi.fn() };
let stripeReady = true;

vi.mock("@stripe/react-stripe-js", () => ({
  PaymentElement: () => <div data-testid="payment-element" />,
  useStripe: () => (stripeReady ? stripe : null),
  useElements: () => (stripeReady ? elements : null),
}));

const plan = { ref: "OWNER", title: "Essential", features: [] } as any;

afterEach(() => vi.clearAllMocks());

describe("CheckoutForm", () => {
  it("shows a loader until Stripe.js is ready", () => {
    stripeReady = false;
    renderWithProviders(<CheckoutForm plan={plan} interval="monthly" testMode={false} />);
    expect(screen.getByRole("progressbar", { hidden: true })).toBeInTheDocument();
    stripeReady = true;
  });

  it("renders the payment element and a Subscribe button once ready", () => {
    stripeReady = true;
    renderWithProviders(<CheckoutForm plan={plan} interval="monthly" testMode={false} />);
    expect(screen.getByTestId("payment-element")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeInTheDocument();
  });

  it("shows the test-mode helper card when testMode is on", () => {
    renderWithProviders(<CheckoutForm plan={plan} interval="monthly" testMode />);
    expect(screen.getByText("Test mode")).toBeInTheDocument();
  });
});
