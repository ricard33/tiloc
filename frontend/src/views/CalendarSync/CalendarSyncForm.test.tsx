import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../common/testRender";
import { CalendarSyncForm } from "./CalendarSyncForm";
import type { BookingChannel, CalendarSync, Lodging } from "../../types";

const lodgings = [{ id: 1, name: "Villa", calendar_url: "https://tiloc/1" }] as unknown as Lodging[];
const channels = [{ id: 5, name: "Airbnb" }] as unknown as BookingChannel[];
const sync = { id: 7, lodging_id: 1, channel_id: 5, active: true, source_url: "https://ota/ical" } as unknown as CalendarSync;

const props = { lodgings, channels, onCancel: vi.fn() };

describe("CalendarSyncForm", () => {
  it("renders the source URL and the Tiloc URL for the selected lodging", () => {
    renderWithProviders(<CalendarSyncForm calendarSync={sync} onSubmit={vi.fn()} onDelete={vi.fn()} {...props} />);
    expect(screen.getByText("Calendar synchronization properties")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://ota/ical")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://tiloc/1")).toBeInTheDocument();
  });

  it("submits the edited sync", async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CalendarSyncForm calendarSync={sync} onSubmit={onSubmit} {...props} />);

    await user.type(screen.getByLabelText(/Source URL/), "-x");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
  });

  it("calls onDelete", async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CalendarSyncForm calendarSync={sync} onSubmit={vi.fn()} onDelete={onDelete} {...props} />);
    await user.click(screen.getByRole("button", { name: /Delete/ }));
    expect(onDelete).toHaveBeenCalledWith(sync);
  });
});
