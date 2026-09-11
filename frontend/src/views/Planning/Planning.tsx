import React, { useCallback, useEffect, useState } from "react";
import { add, format, min as dateMin, parse, startOfMonth, sub } from "date-fns";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { Button, IconButton, Stack, ToggleButton, ToggleButtonGroup } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { DateNavBar } from "./components/NavBar";
import { formatISO } from "../../common/tzUtils";
import PlanningSettingsDialog, { loadPlanningSettings, PlanningSettings } from "./components/PlanningSettingsDialog";
import { useGetLodgingRateCalendarQuery, useListBookingsQuery, useListLodgingsQuery } from "../../services/api";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import "./Planning.scss";
import Page from "../../layouts/Main/Page";
import { Account, Booking, Lodging, User } from "../../types";
import { getBookingStatuses } from "../../common/statusUtils";
import { useAppSelector } from "../../app/hooks";
import { TimelineView } from "./components/TimelineView";
import AnnualView from "./components/AnnualView";


const Planning = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // console.log("search", searchParams);
  // console.log("search", searchParams.get("start"));
  const [goToDate, setGoToDate] = useState<Date | undefined>(undefined);

  const [settingsOpened, setSettingsOpened] = useState<boolean>(false);
  const [settings, setSettings] = useState(loadPlanningSettings());
  const [view, setView] = useState<string|null>(searchParams.get("view") ?? localStorage.getItem("planning.view"));
  // const scrollingTimeline = settings.display === "timeline";
  const scrollingTimeline = view === "timeline";

  let requestedDate = parse(searchParams.get("start") as string, "yyyy-MM", new Date());
  if (isNaN(requestedDate.valueOf()))
    requestedDate = startOfMonth(new Date());

  const [beginDate, setBeginDate] = useState(requestedDate);
  const [dates, setDates] = useState({
    start: requestedDate,
    end: sub(add(requestedDate, { years: 1 }), { days: 1 })
  });
  const dateFilter = scrollingTimeline
    ? formatISO(sub(dates.start, { months: 3 })) + ":" + formatISO(add(dates.end, { months: 5 }))
    : formatISO(dates.start) + ":" + formatISO(dates.end);
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isFetching: IsFetchingBooking,
    refetch
  } = useListBookingsQuery({ for_dates: dateFilter }, {
    pollingInterval: 60000,
    // refetchOnMountOrArgChange: 20,
    refetchOnReconnect: true
  });
  const { data: lodgings, isLoading: isLoadingLodgings } = useListLodgingsQuery({ shown: true });
  const bookingStatuses = getBookingStatuses();
  const navigate = useNavigate();
  const [showLegend, setShowLegend] = useState(false);

  const user = useAppSelector(store => store.auth.user) as User;
  const account = useAppSelector(store => store.auth.account) as Account;
  const canAdd = user.permissions.includes("core.add_booking");
  const canViewPrices = user.permissions.includes("core.view_prices");
  // Set from the timeline's actual canvas bounds (onBoundsChange below), never from `dates`:
  // `dates` is sized for the bookings filter (up to a year) and fetching the rate calendar
  // over that span made the request slow/unreliable. Null until the timeline reports its
  // real, buffered bounds.
  const [rateWindow, setRateWindow] = useState<{ begin: string; end: string } | null>(null);
  const { data: rateCalendars, error: rateCalendarError } = useGetLodgingRateCalendarQuery(
    rateWindow ?? { begin: "", end: "" },
    { skip: !rateWindow || !settings.showPrices || !canViewPrices || (view !== "timeline" && view !== "annual") }
  );
  useEffect(() => {
    if (rateCalendarError) {
      console.warn("Failed to load the lodging rate calendar", rateCalendarError);
    }
  }, [rateCalendarError]);
  // The annual view shows a fixed `settings.monthsToDisplay` window from `beginDate` (no
  // scroll/canvas measurement like the scrolling timeline), so its rate window can be
  // derived directly instead of waiting for an onBoundsChange-style callback.
  useEffect(() => {
    if (view !== "annual") return;
    const start = startOfMonth(beginDate);
    const end = add(start, { months: settings.monthsToDisplay ?? 12 });
    setRateWindow({ begin: format(start, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") });
  }, [view, beginDate, settings.monthsToDisplay]);
  // const [manualFetching, setManualFetching] = useState(false);

  // console.log(performance.now().toFixed(2), "Planning", bookings?.length);

  useEffect(() => {
    if(view === null && !isLoadingLodgings && lodgings)
      setView(lodgings.length > 3 ? "timeline" : "annual");
  }, [isLoadingLodgings, lodgings, view]);

  useEffect(() => {
    // console.log(performance.now().toFixed(2), "fetching", IsFetchingBooking);
  }, [IsFetchingBooking]);

  const onScroll = useCallback((start: Date, _: Date) => {
    setBeginDate(start);
    const startString = format(start, "yyyy-MM");
    if(startString !== searchParams.get("start")) {
      searchParams.set("start", startString);
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const onBoundsChange = useCallback((start: Date, end: Date) => {
    // console.log("onBoundsChange", formatISODate(start), formatISODate(end), differenceInDays(start, end));
    // const delta = canvasTimeEnd - canvasTimeStart;
    setDates({ start, end });
    // Cap at ~8 months regardless of the canvas width, so a very wide screen can't turn
    // this into the same huge-window problem `dates` has.
    const cappedEnd = dateMin([add(end, { days: 1 }), add(start, { months: 8 })]);
    setRateWindow({ begin: format(start, "yyyy-MM-dd"), end: format(cappedEnd, "yyyy-MM-dd") });
  }, []);

  const onCreateBooking = useCallback((lodging: Lodging, beginDate: Date, endDate?: Date) => {
    console.debug(`CREATE ${lodging ? lodging.id : null}, ${beginDate.toDateString()}, ${endDate?.toDateString()}`);
    navigate(`new?lodging_id=${lodging.id}&begin_date=${formatISO(beginDate)}`
      + (endDate ? `&end_date=${formatISO(endDate)}` : ""));
  }, [navigate]);

  const handleCloseEdit = useCallback(() => {
    navigate(-1);
    refetch();
  }, [navigate, refetch]);

  const onEditContract = useCallback((booking: Booking) => {
    navigate("/bookings/" + booking.id + "/contract");
  }, [navigate]);

  const onCloseSettings = useCallback((newSettings?: PlanningSettings) => {
    setSettingsOpened(false);
    if (typeof newSettings !== "undefined") {
      setSettings(newSettings);
    }
  }, []);

  const handleSetView = useCallback((viewName: string) => {
    if (["timeline", "annual", "monthly"].includes(viewName)) {
      setView(viewName);
      searchParams.set("view", viewName);
      setSearchParams(searchParams, { replace: true });
      localStorage.setItem("planning.view", viewName);
    }
  }, [searchParams, setSearchParams]);

  return (
    <Page className="planning">
      <Routes>
        <Route
          path=":bookingId"
          element={
            <BookingDialogLoader
              onClose={handleCloseEdit}
              onOpenContract={onEditContract}
            />}
        />
      </Routes>
      <Stack direction={"row"} sx={{marginBottom: 1}}>
        <ToggleButtonGroup
          value={view} exclusive color="primary"
          size="small"
          onChange={(_, value) => handleSetView(value)}
        >
          <ToggleButton value={"timeline"}>{t("Timeline")}</ToggleButton>
          <ToggleButton value={"annual"}>{t("Annual")}</ToggleButton>
          {/*<ToggleButton value={"monthly"}>{t("Monthly")}</ToggleButton>*/}
        </ToggleButtonGroup>
      </Stack>
      <Stack direction={"row"}>
        <IconButton
          type="button"
          color="default"
          onClick={() => setSettingsOpened(true)}
          size="small"
        ><SettingsIcon /></IconButton>
        <DateNavBar
          date={scrollingTimeline ? beginDate : dates.start}
          // onChange={(newDate) => setDates({ start: newDate, end: add(newDate, { years: 1 }) })}
          onChange={scrollingTimeline
            ? (newDate) => setGoToDate(newDate)
            : (newDate) => {
              setBeginDate(startOfMonth(newDate));
              setDates({
                start: startOfMonth(newDate),
                end: add(startOfMonth(newDate), { years: 1 })
              });
              searchParams.set("start", format(newDate, "yyyy-MM"));
              setSearchParams(searchParams, { replace: true });
            }
          }
          hideMonthNav={scrollingTimeline}
        />
      </Stack>
      {view === "timeline" &&
        <TimelineView
          bookings={bookings ?? []}
          lodgings={[...((lodgings && lodgings.slice(0, account.current_plan.max_lodgings)) ?? [])]}
          defaultBeginDate={beginDate}
          goToDate={goToDate}
          onCreateBooking={canAdd ? onCreateBooking : undefined}
          onScroll={onScroll}
          onBoundsChange={onBoundsChange}
          settings={settings}
          rateCalendars={rateCalendars}
          canViewPrices={canViewPrices}
          disabled={isLoadingBookings}
        />}
      {view === "annual" &&
        <AnnualView
          bookings={bookings ?? []}
          lodgings={[...((lodgings && lodgings.slice(0, account.current_plan.max_lodgings)) ?? [])]}
          beginDate={startOfMonth(beginDate)}
          onCreateBooking={canAdd ? onCreateBooking : undefined}
          settings={settings}
          rateCalendars={rateCalendars}
          canViewPrices={canViewPrices}
          disabled={isLoadingBookings}
        />
      }
      {/*{view === "monthly" &&*/}
      {/*  <BookingFixedTimeline*/}
      {/*    bookings={bookings ?? []}*/}
      {/*    lodgings={[...((lodgings && lodgings.slice(0, account.current_plan.max_lodgings)) ?? [])]}*/}
      {/*    beginDate={startOfMonth(beginDate)}*/}
      {/*    onCreateBooking={canAdd ? onCreateBooking : undefined}*/}
      {/*    settings={settings}*/}
      {/*    disabled={isLoadingBookings}*/}
      {/*  />*/}
      {/*}*/}

      <br />
      {/*<Card className="planning-legend">*/}
      <p>
        <Button
          variant="outlined" onClick={() => setShowLegend(!showLegend)}
        >{showLegend ? t("Hide legend") : t("Show legend")}</Button>
        {/*<span className="status-legend-title">*/}
        {/*  {t("Legend")} :*/}
        {/*</span>*/}
        {showLegend && bookingStatuses.map(status => {
          return (
            <span key={status.name}>
              <span
                className="status-legend"
                style={{ background: status.color }}
              >{status.getLabel(t)}</span> </span>);
        })}
      </p>
      {/*</Card>*/}
      {settingsOpened &&
        <PlanningSettingsDialog
          open={settingsOpened}
          settings={settings}
          onClose={onCloseSettings}
        />}
    </Page>
  );
};

export default Planning;
