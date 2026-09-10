import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import SeasonCalendarList from "./SeasonCalendarList";

vi.mock("axios");

const calendars = {
  count: 2,
  results: [
    { id: 1, name: "Standard", notes: "", seasons: [{ id: 1, name: "High", color: "#f00", rank: 0, date_ranges: [] }], lodging_count: 3 },
    { id: 2, name: "Coast", notes: "", seasons: [], lodging_count: 0 }
  ]
};

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: calendars, status: 200 })));
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/settings/seasons" element={<SeasonCalendarList />} />
    <Route path="/settings/seasons/:calendarId" element={<div>calendar detail</div>} />
  </Routes>
);

describe("SeasonCalendarList", () => {
  it("lists the calendars and opens one", async () => {
    const user = userEvent.setup();
    renderWithProviders(routes, {
      route: "/settings/seasons",
      user: { permissions: ["core.view_seasoncalendar"] }
    });
    expect(await screen.findByText("Standard")).toBeInTheDocument();
    expect(screen.getByText("Coast")).toBeInTheDocument();

    await user.click(screen.getByText("Standard"));
    expect(await screen.findByText("calendar detail")).toBeInTheDocument();
  });
});
