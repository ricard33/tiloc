import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../../common/testRender";
import LodgingRanking from "./LodgingRanking";
import { FillingRateRow } from "../types";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const lodgings = [
  { id: 1, name: "Villa Rose", rank: 1, daily_rate: 100 },
  { id: 2, name: "Studio Blue", rank: 2, daily_rate: 60 },
];

const data: FillingRateRow[] = [
  {
    date: "2030-01",
    days: 20,
    capacity: 60,
    rate: 33,
    turnover: 3000,
    1: { days: 15, turnover: 2000 },
    2: { days: 5, turnover: 1000 },
  } as unknown as FillingRateRow,
];

describe("LodgingRanking", () => {
  beforeEach(() => {
    (axios as any).mockResolvedValue({ data: { count: lodgings.length, results: lodgings }, status: 200 });
  });

  it("ranks lodgings by turnover when the user can view prices", async () => {
    renderWithProviders(<LodgingRanking data={data} />, { user: { permissions: ["core.view_prices"] } });

    expect(await screen.findByText("Villa Rose")).toBeInTheDocument();
    expect(screen.getByText("Studio Blue")).toBeInTheDocument();
    expect(screen.getByText("Turnover")).toBeInTheDocument();
  });

  it("hides the turnover column without view_prices", async () => {
    renderWithProviders(<LodgingRanking data={data} />, { user: { permissions: [] } });

    expect(await screen.findByText("Villa Rose")).toBeInTheDocument();
    expect(screen.queryByText("Turnover")).not.toBeInTheDocument();
  });

  it("only shows lodgings selected in the lodging filter", async () => {
    renderWithProviders(<LodgingRanking data={data} lodgingIds={[1]} />, { user: { permissions: ["core.view_prices"] } });

    expect(await screen.findByText("Villa Rose")).toBeInTheDocument();
    expect(screen.queryByText("Studio Blue")).not.toBeInTheDocument();
  });
});
