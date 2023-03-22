import React, { useEffect, useState } from "react";
import { add, parse, startOfMonth } from "date-fns";
import { BookingScheduler } from "./components";
import { useTranslation } from "react-i18next";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Grid, Button, IconButton, Card, CardContent, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import DescriptionIcon from "@mui/icons-material/Description";
import EditIcon from "@mui/icons-material/Edit";
import SettingsIcon from "@mui/icons-material/Settings";
import queryString from "query-string";
import NavBar from "./components/NavBar";
import { formatISO } from "../../common/tzUtils";
import { useLocalStorage } from "../../common/useLocalStorage";
import PlanningSettingsDialog, { PlanningSettings } from "./components/PlanningSettingsDialog";
import {
  useListBookingsQuery,
  useListBookingStatusesQuery,
  useListLodgingsQuery,
} from "../../services/api";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import "./Planning.scss";
import { useSelector } from "react-redux";
import Page from "../../layouts/Main/Page";
import { RootState } from "../../store";
import { Booking, Lodging, User } from "../../types";
import { useBookingActions } from "../../common/bookingActions";
import { useDeviceDetector } from "../../common/useDeviceDetector";


const Planning = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { hasTouchScreen } = useDeviceDetector();
  const query = queryString.parse(location.search);
  let requestedDate = parse(query.start as string, "yyyy-MM", new Date());
  if (isNaN(requestedDate.valueOf()))
    requestedDate = new Date();

  const [beginDate, setBeginDate] = useState(startOfMonth(requestedDate));
  const dateFilter = formatISO(beginDate) + ":" + formatISO(add(beginDate, { years: 1 }));
  const {
    data: bookings,
    isLoading: isLoadingBookings,
    isFetching: IsFetchingBooking
  } = useListBookingsQuery({ for_dates: dateFilter }, { pollingInterval: 60000 });
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const { data: bookingStatuses } = useListBookingStatusesQuery();
  const [selected, setSelected] = useState<Booking | null>(null);
  const navigate = useNavigate();
  const [settingsOpened, setSettingsOpened] = useState<boolean>(false);
  const [settings, setSettings] = useLocalStorage("planningSettings", {
    showPaymentStatus: true,
    monthsToDisplay: 12,
  });
  const [showTooltips, setShowTooltips] = useLocalStorage("planning.showTooltips", !hasTouchScreen);

  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const canViewContract = user.permissions.includes("core.view_contract");
  const { onDeleteBooking } = useBookingActions();
  // const [manualFetching, setManualFetching] = useState(false);

  // console.log(performance.now().toFixed(2), "Planning", bookings?.length);

  useEffect(() => {
    // console.log(performance.now().toFixed(2), "fetching", IsFetchingBooking);
  }, [IsFetchingBooking]);


  const onEditBooking = (booking: Booking) => {
    console.debug("EDIT ", booking.id);
    navigate(`${booking.id}`);
  };

  const onCreateBooking = (lodging: Lodging, begin_date: Date) => {
    console.debug("CREATE ", lodging ? lodging.id : null, begin_date);
    navigate(`new?lodging_id=${lodging.id}&begin_date=${formatISO(begin_date)}`);
  };

  const handleCloseEdit = () => {
    navigate(-1);
    setSelected(null);
  };

  const onSelectBooking = (booking: Booking) => {
    console.debug("onSelectBooking", booking);
    setSelected(booking);
  };

  const onDeselectBooking = () => {
    setSelected(null);
  };

  const onEditContract = (booking: Booking) => {
    navigate("/bookings/" + booking.id + "/contract");
  };

  const onCloseSettings = (newSettings?: PlanningSettings) => {
    setSettingsOpened(false);
    if (typeof newSettings !== "undefined") {
      setSettings(newSettings);
      setShowTooltips(newSettings.showTooltips)
    }
  };

  // const bookings2 = bookings.map(booking => ({
  //   ...booking,
  //   status: bookingStatuses.filter(s => s.id === booking.status_id)[0],
  //   lodging: lodgings.filter(l => l.id === booking.lodging_id)[0],
  //   source: booking.source_id ? bookingChannels.filter(c => c.id === booking.source_id)[0] : undefined
  // }));

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
          className="delete-button"
          color="secondary"
          onClick={() => onDeleteBooking(selected!)}
          disabled={!canDelete || !selected}
          size="large"
        ><DeleteIcon /></IconButton>
        <IconButton
          type="button"
          color="default"
          onClick={() => onEditContract(selected!)}
          title={t("Contract")}
          disabled={!canViewContract && !selected}
          size="large"
        ><DescriptionIcon /></IconButton>
        <IconButton
          type="submit"
          color="primary"
          onClick={() => onEditBooking(selected!)}
          disabled={!selected}
          size="large"
        ><EditIcon /></IconButton>
        <IconButton
          type="button"
          color="default"
          onClick={() => setSettingsOpened(true)}
          size="large"
        ><SettingsIcon /></IconButton>
      </div>
      <NavBar
        date={beginDate} onChange={(newDate) => {
          setBeginDate(newDate);
        }}
      />
      <BookingScheduler
        bookings={bookings ?? []}
        lodgings={[...(lodgings ?? [])]}
        beginDate={beginDate}
        onCreateBooking={canAdd ? onCreateBooking : undefined}
        onOpenBooking={onEditBooking}
        onItemSelected={onSelectBooking}
        onItemDeselected={onDeselectBooking}
        settings={settings}
        disabled={isLoadingBookings}
      />
      <Grid container justifyContent="space-between" alignItems="flex-start">
        <Grid item>
          <Button
            type="button"
            className="delete-button"
            color="secondary"
            startIcon={<DeleteIcon />}
            onClick={() => onDeleteBooking(selected!)}
            disabled={!selected}
          >{t("Delete")}</Button>
        </Grid>
        <Grid item>
          <Button
            type="button"
            startIcon={<DescriptionIcon />}
            onClick={() => onEditContract(selected!)}
            title={t("Contract")}
            disabled={!selected}
          >{t("Contract")}</Button>
        </Grid>
        <Grid item>
          <Button
            type="submit"
            color="primary"
            startIcon={<EditIcon />}
            onClick={() => onEditBooking(selected!)}
            disabled={!selected}
          >{t("Edit booking")}</Button>
        </Grid>
      </Grid>

      <br />
      <Card className="planning-legend">
        <CardContent>
          <Typography variant="h5" component="h2">
            {t("Legend")}
          </Typography>
          {bookingStatuses && bookingStatuses.map(status => {
            return (
              <span key={status.id}>
                <span
                  className="status-legend"
                  style={{ background: "#" + status.color }}
                >{status.name}</span> </span>);
          })}
        </CardContent>
      </Card>
      {settingsOpened &&
        <PlanningSettingsDialog
          open={settingsOpened}
          settings={{
            ...settings,
            showTooltips: showTooltips
          }}
          onClose={onCloseSettings}
        />}
    </Page>
  );
};

export default Planning;
