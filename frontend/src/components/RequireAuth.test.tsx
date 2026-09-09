import React from "react";
import { Route, Routes } from "react-router-dom";
import { screen } from "@testing-library/react";
import { RequireAuth } from "./RequireAuth";
import { renderWithProviders } from "../common/testRender";

const tree = (
  <Routes>
    <Route element={<RequireAuth />}>
      <Route path="/" element={<div>protected home</div>} />
      <Route path="/setup" element={<div>setup wizard</div>} />
    </Route>
    <Route path="/login" element={<div>login page</div>} />
  </Routes>
);

describe("RequireAuth", () => {
  it("shows a loader while auth is still loading", () => {
    renderWithProviders(tree, { preloadedState: { auth: { isAuthenticated: false, isLoading: true } } });
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", () => {
    renderWithProviders(tree, { user: null });
    expect(screen.getByText("login page")).toBeInTheDocument();
  });

  it("renders the protected outlet when authenticated and initialized", () => {
    renderWithProviders(tree, {
      user: { permissions: [] },
      preloadedState: {
        auth: { isAuthenticated: true, isLoading: false, account: { is_initialized: true } },
      },
    });
    expect(screen.getByText("protected home")).toBeInTheDocument();
  });

  it("redirects to /setup when the account is not initialized", () => {
    renderWithProviders(tree, {
      preloadedState: {
        auth: { isAuthenticated: true, isLoading: false, account: { is_initialized: false } },
      },
    });
    expect(screen.getByText("setup wizard")).toBeInTheDocument();
  });

  it("stays on /setup without redirect-looping", () => {
    renderWithProviders(tree, {
      route: "/setup",
      preloadedState: {
        auth: { isAuthenticated: true, isLoading: false, account: { is_initialized: false } },
      },
    });
    expect(screen.getByText("setup wizard")).toBeInTheDocument();
  });
});
