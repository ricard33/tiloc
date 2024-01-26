import React, { useCallback, useEffect, useState } from "react";
import { add, format, parse, startOfMonth, sub } from "date-fns";
import { BookingFixedTimeline } from "./components";
import { useTranslation } from "react-i18next";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { IconButton, Stack } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { DateNavBar } from "./components/NavBar";
import { formatISO } from "../../common/tzUtils";
import PlanningSettingsDialog, { loadPlanningSettings, PlanningSettings } from "./components/PlanningSettingsDialog";
import { useListBookingsQuery, useListLodgingsQuery } from "../../services/api";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import "./Planning.scss";
import Page from "../../layouts/Main/Page";
import { Account, Booking, Lodging, User } from "../../types";
import { getBookingStatuses } from "../../common/statusUtils";
import { useAppSelector } from "../../app/hooks";
import { TimelineView } from "./components/TimelineView";


const Planning = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // console.log("search", searchParams);
  // console.log("search", searchParams.get("start"));
  const [goToDate, setGoToDate] = useState<Date | undefined>(undefined);

  const [settingsOpened, setSettingsOpened] = useState<boolean>(false);
  const [settings, setSettings] = useState(loadPlanningSettings());
  const scrollingTimeline = settings.display === "timeline";

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
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const bookingStatuses = getBookingStatuses();
  const navigate = useNavigate();

  const user = useAppSelector(store => store.auth.user) as User;
  const account = useAppSelector(store => store.auth.account) as Account;
  const canAdd = user.permissions.includes("core.add_booking");
  // const [manualFetching, setManualFetching] = useState(false);

  // console.log(performance.now().toFixed(2), "Planning", bookings?.length);

  useEffect(() => {
    // console.log(performance.now().toFixed(2), "fetching", IsFetchingBooking);
  }, [IsFetchingBooking]);

  const onScroll = useCallback((start: Date, _: Date) => {
    setBeginDate(start);
    setSearchParams({ start: format(start, "yyyy-MM") });
  }, [setSearchParams]);

  const onBoundsChange = useCallback((start: Date, end: Date) => {
    console.info("onBoundsChange", start.toDateString(), end.toDateString());
    // const delta = canvasTimeEnd - canvasTimeStart;
    setDates({ start, end });
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
            : (newDate) => setDates({
              start: startOfMonth(newDate),
              end: add(startOfMonth(newDate), { years: 1 })
            })
          }
          hideMonthNav={scrollingTimeline}
        />
      </Stack>
      {scrollingTimeline ?
        <TimelineView
          bookings={bookings ?? []}
          lodgings={[...((lodgings && lodgings.slice(0, account.current_plan.max_lodgings)) ?? [])]}
          defaultBeginDate={beginDate}
          goToDate={goToDate}
          onCreateBooking={canAdd ? onCreateBooking : undefined}
          onScroll={onScroll}
          onBoundsChange={onBoundsChange}
          settings={settings}
          disabled={isLoadingBookings}
        />
        :
        <BookingFixedTimeline
          bookings={bookings ?? []}
          lodgings={[...((lodgings && lodgings.slice(0, account.current_plan.max_lodgings)) ?? [])]}
          beginDate={dates.start}
          onCreateBooking={canAdd ? onCreateBooking : undefined}
          settings={settings}
          disabled={isLoadingBookings}
        />
      }

      <br />
      {/*<Card className="planning-legend">*/}
      <p>
        <span className="status-legend-title">
          {t("Legend")} :
        </span>
        {bookingStatuses.map(status => {
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
