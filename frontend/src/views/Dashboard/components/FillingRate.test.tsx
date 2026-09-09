import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import FillingRate from "./FillingRate";

vi.mock("axios");
vi.mock("react-chartjs-2", () => ({ Chart: () => <div data-testid="chart" /> }));

beforeEach(() => {
  (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 }));
  (axios.get as any).mockResolvedValue({ data: [] });
});
afterEach(() => vi.clearAllMocks());

describe("FillingRate", () => {
  it("fetches the filling rate for the current range and renders the chart", async () => {
    renderWithProviders(<FillingRate />, { user: { permissions: [] } });

    expect(await screen.findByTestId("chart")).toBeInTheDocument();
    expect((axios.get as any).mock.calls.some(([u]: string[]) => u.startsWith("stats/filling_rate/"))).toBe(true);
    expect(screen.getByText("Filling rate")).toBeInTheDocument();
  });

  it("switches the header title when the 'per lodging' mode is selected", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FillingRate />, { user: { permissions: [] } });
    await screen.findByTestId("chart");

    await user.click(screen.getByRole("radio", { name: "per lodging" }));
    expect(screen.getByText("Turnover per lodging")).toBeInTheDocument();
  });
});
