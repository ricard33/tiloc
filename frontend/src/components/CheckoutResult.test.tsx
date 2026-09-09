import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import CheckoutResult from "./CheckoutResult";
import { renderWithProviders } from "../common/testRender";

vi.mock("axios");

const mockStatus = (status: string) =>
  (axios.get as any).mockResolvedValue({ data: { status } });

describe("CheckoutResult", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders nothing until the subscription is loaded", () => {
    (axios.get as any).mockReturnValue(new Promise(() => {}));
    const { container } = renderWithProviders(<CheckoutResult subscriptionId="sub_1" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a success alert for an active subscription", async () => {
    mockStatus("active");
    renderWithProviders(<CheckoutResult subscriptionId="sub_1" />);
    expect(await screen.findByText("Successful transaction")).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/subscription/sub_1/");
  });

  it("shows an error alert when the transaction is open", async () => {
    mockStatus("open");
    renderWithProviders(<CheckoutResult subscriptionId="sub_1" />);
    expect(await screen.findByText("Transaction error")).toBeInTheDocument();
  });

  it("shows a warning for any other status", async () => {
    mockStatus("past_due");
    renderWithProviders(<CheckoutResult subscriptionId="sub_1" />);
    expect(await screen.findByText("Wrong transaction status")).toBeInTheDocument();
  });
});
