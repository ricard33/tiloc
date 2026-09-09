import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { ServicePage } from "./ServicePage";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/services/new" element={<ServicePage />} />
    <Route path="/services/:serviceId" element={<ServicePage />} />
    <Route path="/services" element={<div>services list</div>} />
  </Routes>
);

describe("ServicePage", () => {
  it("renders an empty form in create mode", () => {
    renderWithProviders(routes, { route: "/services/new", user: { permissions: ["core.add_service"] } });
    expect(screen.getByText("Service properties")).toBeInTheDocument();
  });

  it("creates the service then navigates back to the list", async () => {
    (axios as any).mockResolvedValue({ data: { id: 9, designation: "New", reference: "R" }, status: 201 });
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: ["/services", "/services/new"],
      user: { permissions: ["core.add_service", "core.change_service"] },
    });

    await user.type(screen.getByLabelText(/Designation/), "New service");
    await user.type(screen.getByLabelText(/Reference/), "NEW");
    await user.type(screen.getByLabelText(/Daily unit price/), "20");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("services list")).toBeInTheDocument();
    expect((axios as any).mock.calls.some(([c]: any[]) => c.method === "POST" && String(c.url).includes("service/"))).toBe(
      true
    );
  });
});
