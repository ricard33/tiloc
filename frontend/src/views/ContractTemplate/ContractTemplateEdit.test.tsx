import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import ContractTemplateEdit from "./ContractTemplateEdit";

vi.mock("axios");
vi.mock("../../components/Editor", () => ({
  default: (props: any) => (
    <textarea aria-label="editor" value={props.data ?? ""} onChange={(e) => props.onChange?.(e.target.value)} />
  ),
}));

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/contract-templates/new" element={<ContractTemplateEdit />} />
    <Route path="/contract-templates" element={<div>templates list</div>} />
  </Routes>
);

describe("ContractTemplateEdit", () => {
  it("renders the editor form in create mode", async () => {
    renderWithProviders(routes, {
      route: ["/contract-templates", "/contract-templates/new"],
      user: { permissions: ["core.add_contracttemplate"] },
    });

    expect(await screen.findByLabelText("Template name")).toBeInTheDocument();
    expect(await screen.findByLabelText("editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("returns to the list from Cancel", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: ["/contract-templates", "/contract-templates/new"],
      user: { permissions: ["core.add_contracttemplate"] },
    });
    await screen.findByLabelText("Template name");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByText("templates list")).toBeInTheDocument();
  });

  it("does not offer a Delete button while creating", async () => {
    renderWithProviders(routes, {
      route: ["/contract-templates", "/contract-templates/new"],
      user: { permissions: ["core.add_contracttemplate", "core.delete_contracttemplate"] },
    });
    await screen.findByLabelText("Template name");
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });
});
