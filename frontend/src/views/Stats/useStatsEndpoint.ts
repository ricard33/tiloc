import { useEffect, useState } from "react";
import axios from "axios";
import { formatISO } from "../../common/tzUtils";
import { DateRange } from "../../components/DateRangeSelector";

/** Fetches one `/stats/<endpoint>/<begin>/<end>/` card, matching the ad-hoc axios pattern
 * already used by the Dashboard's FillingRate/ChannelsDistribution widgets.
 * Pass `enabled: false` to skip the request entirely (e.g. an endpoint gated behind a
 * permission the current user doesn't have) and keep returning `defaultValue`. */
export function useStatsEndpoint<T>(
  endpoint: string,
  dateRange: DateRange,
  defaultValue: T,
  enabled = true,
  lodgingIds: number[] = []
) {
  const [data, setData] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  // Depend on primitive timestamps, not the Date objects: a caller that recomputes its
  // DateRange on every render (e.g. deriving "previous year" from another DateRange) hands
  // us a *new* Date instance each time even when the underlying moment is unchanged, and
  // Date objects compare by reference in a useEffect dependency array — that reference
  // churn re-triggered this effect, which called setData/setLoaded, which caused the
  // re-render that produced yet another new Date, looping the fetch forever.
  const startTime = dateRange.startDate.getTime();
  const endTime = dateRange.endDate.getTime();
  // Same reference-churn trap as above: depend on the joined string, not the array.
  const lodgingParam = lodgingIds.join(",");

  useEffect(() => {
    if (!enabled) {
      setData(defaultValue);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const query = lodgingParam ? `?lodging=${lodgingParam}` : "";
    axios
      // absolute path: unlike the Dashboard's `stats/...` (relative, only correct from "/"),
      // this page can be reached from a nested route (`/reports/stats`), where a relative URL
      // would resolve against the current path instead of the site root.
      .get(`/stats/${endpoint}/${formatISO(startTime)}/${formatISO(endTime)}/${query}`)
      .then(response => {
        setData(response.data);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, startTime, endTime, enabled, lodgingParam]);

  return { data, loaded };
}
