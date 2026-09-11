import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import Planning from "./Planning";

vi.mock("axios");
vi.mock("./components/TimelineView", () => ({
  // Mimics the real component reporting its (buffered, bounded) canvas once it has measured
  // itself, so Planning's rate-calendar window can be exercised without mounting the canvas.
  TimelineView: (props: any) => {
    React.useEffect(() => {
      props.onBoundsChange?.(new Date(2026, 0, 1), new Date(2026, 3, 30));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div>timeline view</div>;
  }
}));
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

  it("fetches the rate calendar for the timeline's bounded canvas, never the ~1 year booking window", async () => {
    localStorage.setItem("planning.showPrices", "true");
    renderWithProviders(<Planning />, {
      ...opts,
      user: { permissions: ["core.view_booking", "core.view_prices"] },
    });
    await screen.findByText("timeline view");

    await waitFor(() => {
      const rateCalls = (axios as any).mock.calls
        .map((c: any[]) => c[0])
        .filter((cfg: any) => String(cfg.url).includes("lodging/rate_calendar/"));
      expect(rateCalls).toHaveLength(1);
      expect(rateCalls[0].url).toContain("begin=2026-01-01");
      expect(rateCalls[0].url).toContain("end=2026-05-01"); // the mock's bounds, +1 day — not a year out
    });
  });

  it("also fetches the rate calendar for the annual view", async () => {
    localStorage.setItem("planning.showPrices", "true");
    renderWithProviders(<Planning />, {
      ...opts,
      route: "/planning?view=annual",
      user: { permissions: ["core.view_booking", "core.view_prices"] },
    });
    await screen.findByText("annual view");

    await waitFor(() => {
      const rateCalls = (axios as any).mock.calls
        .map((c: any[]) => c[0])
        .filter((cfg: any) => String(cfg.url).includes("lodging/rate_calendar/"));
      expect(rateCalls.length).toBeGreaterThan(0);
    });
  });
});
