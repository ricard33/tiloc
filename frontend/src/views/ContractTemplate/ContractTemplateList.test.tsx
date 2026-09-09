import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import ContractTemplateList from "./ContractTemplateList";

vi.mock("axios");

const templates = {
  count: 1,
  results: [{ id: 1, name: "Standard contract", created: "2026-01-01", modified: "2026-02-01" }],
};

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: templates, status: 200 })));
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/contract-templates" element={<ContractTemplateList />} />
    <Route path="/contract-templates/new" element={<div>new template</div>} />
  </Routes>
);

describe("ContractTemplateList", () => {
  it("renders the Name/Created/Modified columns", async () => {
    renderWithProviders(routes, {
      route: "/contract-templates",
      user: { permissions: ["core.view_contracttemplate"] },
    });
    const headers = await screen.findAllByRole("columnheader");
    expect(headers.map((h) => h.textContent)).toEqual(expect.arrayContaining(["Name", "Created", "Modified"]));
  });

  it("navigates to the create screen via the Create tool", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: "/contract-templates",
      user: { permissions: ["core.add_contracttemplate"] },
    });

    await user.click(await screen.findByRole("button", { name: "Create" }));
    expect(await screen.findByText("new template")).toBeInTheDocument();
  });

  it("disables Create without the add permission", async () => {
    renderWithProviders(routes, {
      route: "/contract-templates",
      user: { permissions: ["core.view_contracttemplate"] },
    });
    expect(await screen.findByRole("button", { name: "Create" })).toBeDisabled();
  });
});
