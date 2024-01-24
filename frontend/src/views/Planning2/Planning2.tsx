import React, { useCallback, useEffect, useState } from "react";
import { add, format, parse, startOfMonth, sub } from "date-fns";
import { useTranslation } from "react-i18next";
import { Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { IconButton, Stack } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import queryString from "query-string";
import { formatISO } from "../../common/tzUtils";
import { useLocalStorage } from "../../common/useLocalStorage";
import { useListBookingsQuery, useListLodgingsQuery } from "../../services/api";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import "./Planning2.scss";
import Page from "../../layouts/Main/Page";
import { Account, Booking, Lodging, User } from "../../types";
import useWindowDimensions from "../../common/windowDimensions";
import { getBookingStatuses } from "../../common/statusUtils";
import { useAppSelector } from "../../app/hooks";
import { TimelineView } from "./components/TimelineView";
import PlanningSettingsDialog, { PlanningSettings } from "../Planning/components/PlanningSettingsDialog";
import { DateNavBar } from "../Planning/components";


const Planning = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  // console.log("search", searchParams);
  const query = queryString.parse(location.search);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [goToDate, setGoToDate] = useState<Date | undefined>(undefined);

  const [settingsOpened, setSettingsOpened] = useState<boolean>(false);
  const [showPaymentStatus, setShowPaymentStatus] = useLocalStorage("planning.showPaymentStatus", true);
  const [monthsToDisplay, setMonthsToDisplay] = useLocalStorage("planning.monthsToDisplay", 12);
  // const [scrollingTimeline, setScrollingTimeline] = useLocalStorage("planning.scrollingTimeline", false);
  // const initialZoomLevel = isDesktop ? 2 : 1;
  const scrollingTimeline = true;

  let requestedDate = parse(query.start as string, "yyyy-MM", new Date());
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

  const onScroll = useCallback((start: Date, end: Date) => {
    setBeginDate(start);
    setSearchParams({ start: format(start, "yyyy-MM") });
  }, [setSearchParams]);

  const onBoundsChange = useCallback((start: Date, end: Date) => {
    console.info("onBoundsChange", start.toDateString(), end.toDateString());
    // const delta = canvasTimeEnd - canvasTimeStart;
    setDates({ start, end });
  }, []);

  const onCreateBooking = useCallback((lodging: Lodging, begin_date: Date) => {
    console.debug("CREATE ", lodging ? lodging.id : null, begin_date);
    navigate(`new?lodging_id=${lodging.id}&begin_date=${formatISO(begin_date)}`);
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
      setShowPaymentStatus(newSettings.showPaymentStatus);
      setMonthsToDisplay(newSettings.monthsToDisplay);
      // setScrollingTimeline(newSettings.scrollingTimeline);
    }
  }, [setMonthsToDisplay, setShowPaymentStatus]);

  const settings: PlanningSettings = {
    showPaymentStatus,
    monthsToDisplay,
    scrollingTimeline
  };

  return (
    <Page className="planning2">
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
          date={beginDate}
          // onChange={(newDate) => setDates({ start: newDate, end: add(newDate, { years: 1 }) })}
          onChange={(newDate) => setGoToDate(newDate)}
          hideMonthNav
        />
      </Stack>
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
          settings={{
            showPaymentStatus,
            monthsToDisplay,
            scrollingTimeline
          }}
          onClose={onCloseSettings}
        />}
    </Page>
  );
};

export default Planning;
