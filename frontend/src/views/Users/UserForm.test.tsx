import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import { UserForm } from "./UserForm";
import type { User } from "../../types";

vi.mock("axios");
beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

const existing = {
  id: 4,
  first_name: "Bob",
  last_name: "Stone",
  full_name: "Bob Stone",
  email: "bob@example.com",
  is_active: true,
  groups: ["standard"],
} as unknown as User;

describe("UserForm", () => {
  it("shows the 'User' header and a Delete button for an existing user", async () => {
    renderWithProviders(
      <UserForm user={existing} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={vi.fn()} />
    );
    expect(await screen.findByText("User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("bob@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Delete/ })).toBeInTheDocument();
  });

  it("uses the 'My profile' header in profile mode and has no Delete", async () => {
    renderWithProviders(<UserForm onSubmit={vi.fn()} onCancel={vi.fn()} myProfileOnly />);
    expect((await screen.findAllByText("My profile")).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
  });

  it("calls onDelete with the user", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <UserForm user={existing} onSubmit={vi.fn()} onCancel={vi.fn()} onDelete={onDelete} />
    );
    await user.click(await screen.findByRole("button", { name: /Delete/ }));
    expect(onDelete).toHaveBeenCalledWith(existing);
  });

  it("confirms unsaved changes before cancelling", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<UserForm user={existing} onSubmit={vi.fn()} onCancel={onCancel} />, { confirm });

    await user.type(await screen.findByLabelText(/First name/), "x");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(confirm).toHaveBeenCalledWith(expect.objectContaining({ title: "Unsaved changes detected" }));
    await vi.waitFor(() => expect(onCancel).toHaveBeenCalled());
  });
});
