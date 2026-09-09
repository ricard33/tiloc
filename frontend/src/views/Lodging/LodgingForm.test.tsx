import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { LodgingForm } from "./LodgingForm";
import type { Lodging, User } from "../../types";

vi.mock("axios");
beforeEach(() =>
  (axios as any).mockImplementation(async (config: any) => {
    if (String(config?.url ?? "").includes("contract_template")) {
      return { data: { count: 1, results: [{ id: 1, name: "Default template" }] }, status: 200 };
    }
    return { data: { count: 0, results: [] }, status: 200 };
  })
);
afterEach(() => vi.clearAllMocks());

const users = [{ id: 1, full_name: "Alice Owner", email: "alice@example.com" }] as unknown as User[];
const lodging = {
  id: 5,
  name: "Villa Rose",
  owner_id: 1,
  address: "1 rue du Test",
  daily_rate: 120,
  guaranty: 300,
  deposit_percent: 30,
  deposit_label: "deposit",
  active: true,
  shown: true,
} as unknown as Lodging;

const opts = { user: { id: 1, address: "1 rue du Test", permissions: ["core.change_lodging"] } };

describe("LodgingForm", () => {
  it("pre-fills the name and shows Delete + Close for an existing lodging", async () => {
    renderWithProviders(
      <LodgingForm lodging={lodging} users={users} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />,
      opts
    );
    expect(await screen.findByText("Lodging properties")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Villa Rose")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
  });

  it("calls onDelete with the lodging", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <LodgingForm lodging={lodging} users={users} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={onDelete} />,
      opts
    );
    await user.click(await screen.findByRole("button", { name: /Delete/ }));
    expect(onDelete).toHaveBeenCalledWith(lodging);
  });

  it("still renders when the account has no contract templates", async () => {
    (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 }));
    renderWithProviders(
      <LodgingForm lodging={lodging} users={users} onSubmit={vi.fn()} onCancel={vi.fn()} />,
      opts
    );
    expect(await screen.findByText("Lodging properties")).toBeInTheDocument();
  });

  it("confirms unsaved changes before cancelling", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <LodgingForm lodging={lodging} users={users} onSubmit={vi.fn()} onCancel={onCancel} />,
      { ...opts, confirm }
    );

    await user.type(await screen.findByDisplayValue("Villa Rose"), "!");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Unsaved changes detected" }));
    await vi.waitFor(() => expect(onCancel).toHaveBeenCalled());
  });
});
