import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import Planning from "./Planning";

vi.mock("axios");
vi.mock("./components/TimelineView", () => ({ TimelineView: () => <div>timeline view</div> }));
vi.mock("./components/AnnualView", () => ({ default: () => <div>annual view</div> }));

beforeEach(() => {
  localStorage.clear();
  (axios as any).mockResolvedValue({ data: { count: 0, results: [] }, status: 200 });
});
afterEach(() => vi.clearAllMocks());

const opts = {
  route: "/planning?view=timeline",
  user: { permissions: ["core.view_booking"] },
  account: { current_plan: { max_lodgings: 5 } },
};

describe("Planning", () => {
  it("renders the timeline view with the date nav bar and view toggle", async () => {
    renderWithProviders(<Planning />, opts);
    expect(await screen.findByText("timeline view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
  });

  it("switches to the annual view", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Planning />, opts);
    await screen.findByText("timeline view");

    await user.click(screen.getByRole("button", { name: "Annual" }));
    expect(await screen.findByText("annual view")).toBeInTheDocument();
  });

  it("opens the settings dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Planning />, opts);
    await screen.findByText("timeline view");

    // the settings IconButton is the first button before the nav bar
    await user.click(screen.getAllByRole("button")[2]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("toggles the legend", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Planning />, opts);
    await screen.findByText("timeline view");

    await user.click(screen.getByRole("button", { name: "Show legend" }));
    expect(screen.getByRole("button", { name: "Hide legend" })).toBeInTheDocument();
  });
});
