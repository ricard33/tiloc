import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import SignIn from "./SignIn";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const loginInfo = {
  token: "tok",
  expiry: "2099-01-01",
  user: {
    id: 1,
    email: "jane@example.com",
    account: { id: "acme", current_plan: { price: 0 } },
  },
};

describe("SignIn", () => {
  it("renders the form with the submit disabled until something is typed", () => {
    renderWithProviders(<SignIn />);
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in now" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup");
  });

  it("redirects away when already authenticated", () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<SignIn />} />
        <Route path="/" element={<div>home</div>} />
      </Routes>,
      { route: "/login", user: { email: "jane@example.com" } }
    );
    expect(screen.getByText("home")).toBeInTheDocument();
  });

  it("pre-fills the demo credentials in demo mode", async () => {
    renderWithProviders(<SignIn />, { preloadedState: { appInfo: { isDemo: true } } });
    expect(await screen.findByDisplayValue("admin@app.tiloc.fr")).toBeInTheDocument();
  });

  it("logs in and dispatches loginSuccessful on success", async () => {
    (axios as any).mockResolvedValue({ data: loginInfo, status: 200 });
    const user = userEvent.setup();
    const { store } = renderWithProviders(<SignIn />);

    await user.type(screen.getByLabelText(/Email address/), "jane@example.com");
    await user.type(screen.getByLabelText(/Password/), "s3cret");
    await user.click(screen.getByRole("button", { name: "Sign in now" }));

    await vi.waitFor(() => expect(store.getState().auth.isAuthenticated).toBe(true));
  });
});
