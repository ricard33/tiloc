import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LearnMore from "./LearnMore";
import { renderWithProviders } from "../common/testRender";

describe("LearnMore", () => {
  it("hides its children until the button is clicked, then toggles back", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <LearnMore>
        <p>hidden detail</p>
      </LearnMore>
    );

    expect(screen.queryByText("hidden detail")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Learn more/ }));
    expect(screen.getByText("hidden detail")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Learn more/ }));
    expect(screen.queryByText("hidden detail")).not.toBeInTheDocument();
  });
});
