import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../common/testRender";
import { ServiceForm } from "./ServiceForm";
import type { Service } from "../../types";

const service = {
  id: 3,
  reference: "CLEAN",
  designation: "Cleaning",
  unit_price: 50,
  vat: 0,
  is_flat_rate: true,
  not_included_in_price: false,
} as Service;

describe("ServiceForm", () => {
  it("pre-fills the fields and shows Close (not dirty) for an existing service", () => {
    renderWithProviders(
      <ServiceForm service={service} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />
    );
    expect(screen.getByDisplayValue("Cleaning")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
  });

  it("swaps to Save/Cancel once a field changes and submits the form data", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ServiceForm service={service} onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.clear(screen.getByLabelText(/Designation/));
    await user.type(screen.getByLabelText(/Designation/), "Deep cleaning");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ designation: "Deep cleaning" });
  });

  it("calls onDelete with the service", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <ServiceForm service={service} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={onDelete} />
    );
    await user.click(screen.getByRole("button", { name: /Delete/ }));
    expect(onDelete).toHaveBeenCalledWith(service);
  });

  it("confirms unsaved changes before cancelling", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ServiceForm service={service} onSubmit={vi.fn()} onCancel={onCancel} />, {
      confirm,
    });

    await user.type(screen.getByLabelText(/Designation/), "x");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Unsaved changes detected" })
    );
    await vi.waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it("has no Delete button for a brand-new service", () => {
    renderWithProviders(<ServiceForm onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });
});
