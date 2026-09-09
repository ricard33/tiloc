import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { UserPage } from "./UserPage";

vi.mock("axios");
beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/users/new" element={<UserPage />} />
    <Route path="/users" element={<div>users list</div>} />
  </Routes>
);

describe("UserPage", () => {
  it("renders the user form in create mode", async () => {
    renderWithProviders(routes, {
      route: ["/users", "/users/new"],
      user: { permissions: ["core.add_user"] },
    });
    expect(await screen.findByText("User")).toBeInTheDocument();
  });

  it("returns to the list without saving when Close is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: ["/users", "/users/new"],
      user: { permissions: ["core.add_user"] },
    });

    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(await screen.findByText("users list")).toBeInTheDocument();
  });
});
