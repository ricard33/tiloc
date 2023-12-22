import React, { useCallback, useEffect, useState } from "react";
import { add, parse, startOfMonth, sub } from "date-fns";
import { BookingScheduler, BookingTimeline } from "./components";
import { useTranslation } from "react-i18next";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { IconButton } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import queryString from "query-string";
import { DateNavBar } from "./components/NavBar";
import { formatISO } from "../../common/tzUtils";
import { useLocalStorage } from "../../common/useLocalStorage";
import PlanningSettingsDialog, { PlanningSettings } from "./components/PlanningSettingsDialog";
import { useListBookingsQuery, useListLodgingsQuery } from "../../services/api";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import "./Planning.scss";
import { useSelector } from "react-redux";
import Page from "../../layouts/Main/Page";
import { RootState } from "../../store";
import { Booking, Lodging, User } from "../../types";
import useWindowDimensions from "../../common/windowDimensions";
import { getBookingStatuses } from "../../common/statusUtils";
import { useBookingActions } from "../../common/bookingActions";


const Planning = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const query = queryString.parse(location.search);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [settingsOpened, setSettingsOpened] = useState<boolean>(false);
  const [showPaymentStatus, setShowPaymentStatus] = useLocalStorage("planning.showPaymentStatus", true);
  const [monthsToDisplay, setMonthsToDisplay] = useLocalStorage("planning.monthsToDisplay", 12);
  const [scrollingTimeline, setScrollingTimeline] = useLocalStorage("planning.scrollingTimeline", false);
  const { onCancelBooking } = useBookingActions();
  const initialZoomLevel = isDesktop ? 2 : 1;

  let requestedDate = parse(query.start as string, "yyyy-MM", new Date());
  if (isNaN(requestedDate.valueOf()))
    requestedDate = startOfMonth(new Date());

  // const [beginDate, setBeginDate] = useState(startOfMonth(requestedDate));
  const [dates, setDates] = useState({
    start: requestedDate,
    end: scrollingTimeline ? add(requestedDate, { months: initialZoomLevel }) : add(requestedDate, { years: 1 })
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

  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_booking");
  // const [manualFetching, setManualFetching] = useState(false);

  // console.log(performance.now().toFixed(2), "Planning", bookings?.length);

  useEffect(() => {
    // console.log(performance.now().toFixed(2), "fetching", IsFetchingBooking);
  }, [IsFetchingBooking]);

  const onBoundsChange = useCallback((canvasTimeStart: number, canvasTimeEnd: number) => {
    console.info(new Date(canvasTimeStart).toDateString(), new Date(canvasTimeEnd).toDateString());
    // const delta = canvasTimeEnd - canvasTimeStart;
    setDates({ start: new Date(canvasTimeStart), end: new Date(canvasTimeEnd) });
  }, []);

  const onOpenBooking = useCallback((booking: Booking) => {
    console.debug("EDIT ", booking.id);
    navigate(`${booking.id}`);
  }, [navigate]);

  const onEditBooking = useCallback((booking: Booking) => {
    console.debug("EDIT ", booking.id);
    navigate(`${booking.id}`, {state: {edit: true}});
  }, [navigate]);

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
      setScrollingTimeline(newSettings.scrollingTimeline);
    }
  }, [setMonthsToDisplay, setScrollingTimeline, setShowPaymentStatus]);

  const settings: PlanningSettings = {
    showPaymentStatus,
    monthsToDisplay,
    scrollingTimeline
  };

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
      <div className="toolbar">
        <IconButton
          type="button"
          color="default"
          onClick={() => setSettingsOpened(true)}
          size="large"
        ><SettingsIcon /></IconButton>
      </div>
      {scrollingTimeline ?
        <>
          <BookingTimeline
            bookings={bookings ?? []}
            lodgings={[...((lodgings && lodgings.slice(0, user.account.current_plan.max_lodgings)) ?? [])]}
            beginDate={dates.start}
            endDate={dates.end}
            onCreateBooking={canAdd ? onCreateBooking : undefined}
            onOpenBooking={onOpenBooking}
            onEditBooking={onEditBooking}
            onCancelBooking={onCancelBooking}
            onBoundsChange={onBoundsChange}
            settings={settings}
            disabled={isLoadingBookings}
          />
        </> : <>
          <DateNavBar
            date={dates.start} onChange={(newDate) => setDates({ start: newDate, end: add(newDate, { years: 1 }) })}
          />
          <BookingScheduler
            bookings={bookings ?? []}
            lodgings={[...((lodgings && lodgings.slice(0, user.account.current_plan.max_lodgings)) ?? [])]}
            beginDate={dates.start}
            onCreateBooking={canAdd ? onCreateBooking : undefined}
            onOpenBooking={onOpenBooking}
            onEditBooking={onEditBooking}
            onCancelBooking={onCancelBooking}
            settings={settings}
            disabled={isLoadingBookings}
          />
        </>
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
