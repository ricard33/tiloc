import React from "react";
import { screen } from "@testing-library/react";
import LoadingInProgress from "./LoadingInProgress";
import { renderWithProviders } from "../common/testRender";

describe("LoadingInProgress", () => {
  it("renders a spinner", () => {
    renderWithProviders(<LoadingInProgress />);
    // inside a Backdrop whose fade transition starts hidden under jsdom
    expect(screen.getByRole("progressbar", { hidden: true })).toBeInTheDocument();
  });
});
