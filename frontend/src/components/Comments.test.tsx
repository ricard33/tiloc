import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Comments from "./Comments";
import { renderWithProviders } from "../common/testRender";
import type { Booking, Comment } from "../types";

vi.mock("axios");

const me = { id: 1, full_name: "Alice Martin", email: "alice@example.com" };

const existingComment = {
  id: 10,
  content: "Guests arrive late",
  booking_id: 5,
  created_by: me,
  created_on: "2026-08-01T10:00:00Z",
  modified: "2026-08-01T10:00:00Z",
} as unknown as Comment;

const booking = { id: 5, comments: [existingComment] } as unknown as Booking;

const render = (permissions: string[], props = {}) =>
  renderWithProviders(<Comments booking={booking} {...props} />, {
    user: { id: 1, full_name: "Alice Martin", permissions },
  });

afterEach(() => vi.clearAllMocks());

describe("Comments", () => {
  it("hides everything without the view_comment permission", () => {
    render([]);
    expect(screen.queryByText("Guests arrive late")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Add comment")).not.toBeInTheDocument();
  });

  it("shows existing comments with author and elapsed time", () => {
    render(["core.view_comment"]);
    expect(screen.getByText("Guests arrive late")).toBeInTheDocument();
    expect(screen.getByText(/by Alice Martin/)).toBeInTheDocument();
  });

  it("shows the add-comment field only with add_comment permission", () => {
    render(["core.view_comment", "core.add_comment"]);
    expect(screen.getByLabelText("Add comment")).toBeInTheDocument();
  });

  it("disables edit/delete and hides the add field when readonly", () => {
    render(["core.view_comment", "core.add_comment", "core.change_comment", "core.delete_comment"], {
      readonly: true,
    });
    expect(screen.queryByLabelText("Add comment")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "edit" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "delete" })).toBeDisabled();
  });

  it("enables the validate button once text is entered and creates the comment", async () => {
    const created = {
      id: 11,
      content: "New note",
      booking_id: 5,
      created_by: me,
      created_on: "2026-08-02T10:00:00Z",
      modified: "2026-08-02T10:00:00Z",
    };
    (axios as any).mockImplementation(async () => ({ data: created, status: 201 }));
    const user = userEvent.setup();
    render(["core.view_comment", "core.add_comment"]);

    const validate = screen.getByRole("button", { name: "validate" });
    expect(validate).toBeDisabled();

    await user.type(screen.getByLabelText("Add comment"), "New note");
    expect(validate).toBeEnabled();

    await user.click(validate);
    expect(await screen.findByText("New note")).toBeInTheDocument();
  });

  it("confirms before deleting one's own comment", async () => {
    const confirm = vi.fn().mockResolvedValue(undefined);
    (axios as any).mockImplementation(async () => ({ data: {}, status: 204 }));
    const user = userEvent.setup();
    renderWithProviders(<Comments booking={booking} />, {
      user: { id: 1, full_name: "Alice Martin", permissions: ["core.view_comment", "core.delete_comment"] },
      confirm,
    });

    await user.click(screen.getByRole("button", { name: "delete" }));

    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ description: expect.stringContaining("permanently delete") })
    );
  });
});
