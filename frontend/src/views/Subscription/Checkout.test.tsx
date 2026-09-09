import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import Checkout from "./Checkout";

vi.mock("axios");
vi.mock("@stripe/stripe-js", () => ({ loadStripe: vi.fn(async () => ({})) }));
vi.mock("@stripe/react-stripe-js", () => ({
  Elements: ({ children }: any) => <div data-testid="stripe-elements">{children}</div>,
}));
vi.mock("./CheckoutForm", () => ({ default: () => <div>checkout form</div> }));
vi.mock("./FeaturesList", () => ({ default: () => <div>features</div> }));

const plan = { ref: "OWNER", title: "Essential", price: { monthly: 10, yearly: 100 }, features: [] };

beforeEach(() => {
  (axios.get as any).mockImplementation(async (url: string) => {
    if (url.includes("stripe_config")) return { data: { publishableKey: "pk_test", testMode: true } };
    return { data: {} };
  });
});
afterEach(() => vi.clearAllMocks());

describe("Checkout", () => {
  it("loads the Stripe config and renders the checkout form for a new subscription", async () => {
    renderWithProviders(<Checkout />, {
      route: [{ pathname: "/checkout", state: { plan, interval: "monthly" } }],
      user: { permissions: [] },
      account: { current_subscription: null },
    });

    expect(screen.getByText("Upgrade to Essential plan")).toBeInTheDocument();
    expect(await screen.findByText("checkout form")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/stripe_config/");
  });
});
