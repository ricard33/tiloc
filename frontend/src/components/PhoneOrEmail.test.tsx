import React from "react";
import { screen } from "@testing-library/react";
import PhoneOrEmail from "./PhoneOrEmail";
import { renderWithProviders } from "../common/testRender";

describe("PhoneOrEmail", () => {
  it("turns an email into a mailto link", () => {
    renderWithProviders(<PhoneOrEmail value="Contact john.doe@example.com please" />);
    const link = screen.getByRole("link", { name: "john.doe@example.com" });
    expect(link).toHaveAttribute("href", "mailto:john.doe@example.com");
  });

  it("turns a phone number into tel: and wa.me links", () => {
    renderWithProviders(<PhoneOrEmail value="Call 06 12 34 56 78" />);

    const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.startsWith("tel:"))).toBe(true);
    // a wa.me deep link with the digits, spaces stripped
    expect(hrefs.some((h) => /^https:\/\/wa\.me\/\d*612345678$/.test(h))).toBe(true);
    expect(screen.getByLabelText("WhatsApp")).toBeInTheDocument();
  });

  it("renders plain text unchanged when there is nothing to linkify", () => {
    renderWithProviders(<PhoneOrEmail value="just some words" />);
    expect(screen.getByText("just some words")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
