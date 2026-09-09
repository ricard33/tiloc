import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import LodgingList from "./LodgingList";

vi.mock("axios");

const owner = { id: 1, full_name: "Alice Owner", email: "alice@example.com" };
const lodgings = {
  count: 2,
  results: [
    { id: 1, name: "Villa Rose", owner, daily_rate: 120, guaranty: 300, active: true, shown: true, rank: 1 },
    { id: 2, name: "Studio Blue", owner, daily_rate: 60, guaranty: 100, active: true, shown: true, rank: 2 },
  ],
};

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    if (String(config?.url ?? "").includes("user")) return { data: { count: 1, results: [owner] }, status: 200 };
    return { data: lodgings, status: 200 };
  });
});
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/lodgings" element={<LodgingList />} />
    <Route path="/lodgings/new" element={<div>new lodging</div>} />
    <Route path="/lodgings/:id" element={<div>lodging detail</div>} />
  </Routes>
);

const opts = {
  route: "/lodgings",
  user: { permissions: ["core.view_lodging", "core.add_lodging"] },
  account: { current_plan: { max_lodgings: 10, price: 0 } },
};

describe("LodgingList", () => {
  it("lists the lodgings from the API", async () => {
    renderWithProviders(routes, opts);
    expect(await screen.findByText("Villa Rose")).toBeInTheDocument();
    expect(screen.getByText("Studio Blue")).toBeInTheDocument();
  });

  it("navigates to the create form via the Create tool", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, opts);
    await screen.findByText("Villa Rose");

    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("new lodging")).toBeInTheDocument();
  });

  it("disables Create once the plan lodging limit is reached", async () => {
    renderWithProviders(routes, { ...opts, account: { current_plan: { max_lodgings: 2, price: 0 } } });
    await screen.findByText("Villa Rose");
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });
});
