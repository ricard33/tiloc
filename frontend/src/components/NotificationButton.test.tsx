import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import NotificationButton from "./NotificationButton";
import { renderWithProviders } from "../common/testRender";

vi.mock("axios");

const notifications = {
  count: 3,
  results: [
    { id: 1, notification: "booking-created", description: "New booking", path: "/bookings/1", read: false, date: "2026-09-01T10:00:00Z" },
    { id: 2, notification: "comment-added", description: "New comment", path: "/bookings/1", read: false, date: "2026-09-02T10:00:00Z" },
    { id: 3, notification: "other", description: "Something else", path: "", read: true, date: "2026-09-03T10:00:00Z" },
  ],
};

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    if (config.method === "GET") return { data: notifications, status: 200 };
    return { data: {}, status: 200 };
  });
});
afterEach(() => vi.clearAllMocks());

describe("NotificationButton", () => {
  it("shows the unread count on the badge", async () => {
    renderWithProviders(<NotificationButton />, { user: { permissions: [] } });
    expect(await screen.findByText("2")).toBeInTheDocument(); // 2 of 3 unread
  });

  it("opens a drawer listing the notifications", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationButton />, { user: { permissions: [] } });
    await screen.findByText("2");

    await user.click(screen.getAllByRole("button")[0]); // the bell IconButton

    expect(await screen.findByText("New booking")).toBeInTheDocument();
    expect(screen.getByText("Something else")).toBeInTheDocument();
  });

  it("marks all as read via the toolbar action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationButton />, { user: { permissions: [] } });
    await screen.findByText("2");
    await user.click(screen.getAllByRole("button")[0]);

    await user.click(await screen.findByRole("button", { name: "mark_all_read" }));

    await vi.waitFor(() =>
      expect(
        (axios as any).mock.calls.some(
          ([c]: any[]) => c.method === "PATCH" && String(c.url).includes("all_read")
        )
      ).toBe(true)
    );
  });
});
