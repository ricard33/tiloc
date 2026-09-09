import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import ForgottenPassword from "./ForgottenPassword";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

describe("ForgottenPassword", () => {
  it("renders the reset form with a disabled submit until dirty", () => {
    renderWithProviders(<ForgottenPassword />);
    expect(screen.getByRole("heading", { name: "Reset password" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDisabled();
  });

  it("shows a confirmation with the address after a successful request", async () => {
    (axios as any).mockResolvedValue({ data: "ok", status: 200 });
    const user = userEvent.setup();
    renderWithProviders(<ForgottenPassword />);

    await user.type(screen.getByLabelText(/Email address/), "jane@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText(/check your email jane@example.com/)).toBeInTheDocument();
    expect(
      (axios as any).mock.calls.some(([c]: any[]) => String(c.url).includes("reset_password"))
    ).toBe(true);
  });
});
