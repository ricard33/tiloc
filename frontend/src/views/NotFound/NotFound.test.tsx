import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../common/testRender";
import NotFound from "./NotFound";

describe("NotFound", () => {
  it("renders the 404 message", () => {
    renderWithProviders(<NotFound />);
    expect(screen.getByText(/404/)).toBeInTheDocument();
  });
});
