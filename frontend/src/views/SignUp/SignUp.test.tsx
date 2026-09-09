import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { SignUp } from "./SignUp";

vi.mock("axios");

vi.mock("react-google-recaptcha", () => {
  // eslint-disable-next-line react/display-name
  const Captcha = React.forwardRef((props: any, _ref) => (
    <button type="button" onClick={() => props.onChange("captcha-token")}>
      solve captcha
    </button>
  ));
  Captcha.displayName = "MockCaptcha";
  return { default: Captcha };
});

vi.mock("../Subscription/FeaturesList", () => ({ default: () => <div>features</div> }));

const canRegister = { preloadedState: { appInfo: { canRegister: true } } };

afterEach(() => vi.clearAllMocks());

describe("SignUp", () => {
  it("shows a 'signups closed' notice when registration is disabled", () => {
    renderWithProviders(<SignUp />, { preloadedState: { appInfo: { canRegister: false } } });
    expect(screen.getByText("Signups closed")).toBeInTheDocument();
  });

  it("renders the signup form when registration is open", () => {
    renderWithProviders(<SignUp />, canRegister);
    expect(screen.getByRole("heading", { name: "Sign up" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/signin");
  });

  it("blocks a valid submission until the captcha is solved", async () => {
    (axios as any).mockResolvedValue({ data: {}, status: 200 });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    renderWithProviders(<SignUp />, canRegister);

    await user.type(screen.getByLabelText(/First name/), "Jane");
    await user.type(screen.getByLabelText(/Last name/), "Doe");
    await user.type(screen.getByLabelText(/^Email/), "jane@example.com");
    await user.type(screen.getByLabelText(/^Password/), "s3cretpass");
    await user.type(screen.getByLabelText(/Re-type the password/), "s3cretpass");
    await user.click(screen.getByRole("button", { name: /Start free trial/ }));

    expect(alertSpy).toHaveBeenCalled();
    expect((axios as any).mock.calls.some(([c]: any[]) => String(c.url).includes("signup"))).toBe(false);
    alertSpy.mockRestore();
  });

  it("flags an email that is already in use", async () => {
    (axios as any).mockRejectedValue({
      response: { status: 409, data: { code: "EMAIL_ALREADY_IN_USE" } },
    });
    const user = userEvent.setup();
    renderWithProviders(<SignUp />, canRegister);

    await user.type(screen.getByLabelText(/First name/), "Jane");
    await user.type(screen.getByLabelText(/Last name/), "Doe");
    await user.type(screen.getByLabelText(/^Email/), "taken@example.com");
    await user.type(screen.getByLabelText(/^Password/), "s3cretpass");
    await user.type(screen.getByLabelText(/Re-type the password/), "s3cretpass");
    await user.click(screen.getByRole("button", { name: "solve captcha" }));
    await user.click(screen.getByRole("button", { name: /Start free trial/ }));

    expect(await screen.findByText("This email is already in use")).toBeInTheDocument();
  });
});
