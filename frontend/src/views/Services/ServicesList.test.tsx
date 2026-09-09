import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import ServicesList from "./ServicesList";

vi.mock("axios");

const services = {
  count: 2,
  results: [
    { id: 1, designation: "Cleaning", reference: "CLEAN", unit_price: 50, vat: 0, is_flat_rate: true },
    { id: 2, designation: "Bed linen", reference: "LINEN", unit_price: 15, vat: 0, is_flat_rate: false },
  ],
};

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: services, status: 200 })));
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/services" element={<ServicesList />} />
    <Route path="/services/new" element={<div>new service form</div>} />
    <Route path="/services/:id" element={<div>service detail</div>} />
  </Routes>
);

describe("ServicesList", () => {
  it("shows the services returned by the API", async () => {
    renderWithProviders(routes, { route: "/services", user: { permissions: ["core.view_service"] } });
    expect(await screen.findByText("Cleaning")).toBeInTheDocument();
    expect(screen.getByText("Bed linen")).toBeInTheDocument();
  });

  it("navigates to the create form via the Create tool", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, { route: "/services", user: { permissions: ["core.add_service"] } });
    await screen.findByText("Cleaning");

    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("new service form")).toBeInTheDocument();
  });

  it("disables the Create tool without the add permission", async () => {
    renderWithProviders(routes, { route: "/services", user: { permissions: ["core.view_service"] } });
    await screen.findByText("Cleaning");
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("opens a row on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, { route: "/services", user: { permissions: ["core.view_service"] } });

    await user.click(await screen.findByText("Bed linen"));
    expect(await screen.findByText("service detail")).toBeInTheDocument();
  });
});
