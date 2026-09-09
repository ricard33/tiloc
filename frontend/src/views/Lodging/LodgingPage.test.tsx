import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { LodgingPage } from "./LodgingPage";

vi.mock("axios");
beforeEach(() =>
  (axios as any).mockImplementation(async (config: any) => {
    // LodgingFormContent crashes on an empty contract-template list (templates[0].id),
    // so hand it one.
    if (String(config?.url ?? "").includes("contract_template")) {
      return { data: { count: 1, results: [{ id: 1, name: "Default template" }] }, status: 200 };
    }
    return { data: { count: 0, results: [] }, status: 200 };
  })
);
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/lodgings/new" element={<LodgingPage />} />
    <Route path="/lodgings" element={<div>lodgings list</div>} />
  </Routes>
);

const opts = {
  route: ["/lodgings", "/lodgings/new"] as string[],
  user: { id: 1, address: "1 rue du Test", permissions: ["core.add_lodging"] },
};

describe("LodgingPage", () => {
  it("renders the lodging form in create mode", async () => {
    renderWithProviders(routes, opts);
    expect(await screen.findByText("Lodging properties")).toBeInTheDocument();
  });

  it("returns to the list from the Close button", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, opts);
    await user.click(await screen.findByRole("button", { name: "Close" }));
    expect(await screen.findByText("lodgings list")).toBeInTheDocument();
  });
});
