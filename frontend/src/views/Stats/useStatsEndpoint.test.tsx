import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import { useStatsEndpoint } from "./useStatsEndpoint";
import { DateRange } from "../../components/DateRangeSelector";

vi.mock("axios");

beforeEach(() => {
  (axios.get as any).mockResolvedValue({ data: [] });
});
afterEach(() => vi.clearAllMocks());

const makeRange = (): DateRange => ({
  // fresh Date instances every call, same moment in time — mirrors a caller (like
  // Stats.tsx deriving a "previous year" range from another DateRange) that recomputes
  // its DateRange object on every render
  startDate: new Date("2025-10-01T00:00:00Z"),
  endDate: new Date("2026-09-30T00:00:00Z"),
});

describe("useStatsEndpoint", () => {
  it("does not refetch when a re-render hands it a new DateRange object for the same moment", async () => {
    const { rerender } = renderHook(({ range }) => useStatsEndpoint("filling_rate", range, []), {
      initialProps: { range: makeRange() },
    });

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    // simulate several re-renders with a brand new (but equal-valued) DateRange, as would
    // happen if the caller recomputes it inline instead of memoizing it
    rerender({ range: makeRange() });
    rerender({ range: makeRange() });
    rerender({ range: makeRange() });

    // give any (buggy) extra effect a chance to fire before asserting
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("does refetch when the date range actually changes", async () => {
    const { rerender } = renderHook(({ range }) => useStatsEndpoint("filling_rate", range, []), {
      initialProps: { range: makeRange() },
    });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    rerender({ range: { startDate: new Date("2024-10-01T00:00:00Z"), endDate: new Date("2025-09-30T00:00:00Z") } });

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });

  it("does not append a lodging query param when no lodging filter is set", async () => {
    renderHook(() => useStatsEndpoint("filling_rate", makeRange(), []));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    expect((axios.get as any).mock.calls[0][0]).not.toContain("?lodging=");
  });

  it("appends the selected lodging ids as a comma-separated query param", async () => {
    renderHook(() => useStatsEndpoint("filling_rate", makeRange(), [], true, [1, 2]));
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
    expect((axios.get as any).mock.calls[0][0]).toContain("?lodging=1,2");
  });

  it("does not refetch when a re-render hands it a new but equal-valued lodgingIds array", async () => {
    const { rerender } = renderHook(({ ids }) => useStatsEndpoint("filling_rate", makeRange(), [], true, ids), {
      initialProps: { ids: [1, 2] },
    });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    rerender({ ids: [1, 2] });
    rerender({ ids: [1, 2] });

    await new Promise(resolve => setTimeout(resolve, 0));
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it("does refetch when the lodging filter actually changes", async () => {
    const { rerender } = renderHook(({ ids }) => useStatsEndpoint("filling_rate", makeRange(), [], true, ids), {
      initialProps: { ids: [1] },
    });
    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

    rerender({ ids: [1, 2] });

    await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(2));
  });
});
