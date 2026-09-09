import React from "react";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import { renderWithProviders } from "../../common/testRender";
import Minimal from "./Minimal";

vi.mock("axios");

describe("Minimal layout", () => {
  it("renders the topbar and the routed outlet", () => {
    renderWithProviders(
      <Routes>
        <Route element={<Minimal />}>
          <Route path="/login" element={<div>login form</div>} />
        </Route>
      </Routes>,
      { route: "/login", user: null }
    );

    expect(screen.getByText("login form")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/"); // logo from the topbar
  });
});
