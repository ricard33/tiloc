import React from "react";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../../common/testRender";
import Page from "./Page";

describe("Page", () => {
  it("renders its children", () => {
    renderWithProviders(<Page>hello world</Page>);
    expect(screen.getByText("hello world")).toBeInTheDocument();
  });
});
