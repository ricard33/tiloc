import React, { useEffect, useState } from "react";
import { startOfMonth, parse, add } from "date-fns";
import { BookingScheduler } from "./components";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../libs/MuiConfirm";
import { useNavigate, useLocation } from "react-router-dom";
import { Grid } from "@mui/material";
import Button from "@mui/material/Button";
import { DeleteForever as DeleteIcon, Description as DescriptionIcon, Edit as EditIcon, Settings as SettingsIcon } from "@mui/icons-material";
import queryString from "query-string";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import NavBar from "./components/NavBar";
import { formatISO } from "../../common/tzUtils";
import { useLocalStorage } from "../../common/useLocalStorage";
import PlanningSettingsDialog, { PlanningSettings } from "./components/PlanningSettingsDialog";
import {
  useDeleteBookingMutation,
  useListBookingsQuery,
  useListBookingStatusesQuery,
  useListLodgingsQuery, useUpdateBookingMutation
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import "./Planning.scss";
import { useSelector } from "react-redux";
import Page from "../../layouts/Main/Page";
import { RootState } from "../../store";
import { Booking, Lodging, User } from "../../types";



const Planning = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const query = queryString.parse(location.search);
  let requestedDate = parse(query.start as string, "yyyy-MM", new Date());
  if (isNaN(requestedDate.valueOf()))
    requestedDate = new Date();

  const { showError, showSuccess } = useAlert();
  const [beginDate, setBeginDate] = useState(startOfMonth(requestedDate));
  const dateFilter = formatISO(beginDate) + ":" + formatISO(add(beginDate, {years: 1}))
  const { data: bookings, isLoading: isLoadingBookings, isFetching: IsFetchingBooking } = useListBookingsQuery({for_dates: dateFilter}, {pollingInterval: 60000});
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const { data: bookingStatuses } = useListBookingStatusesQuery();
  const [ updateBooking ] = useUpdateBookingMutation();
  const [ deleteBooking ] = useDeleteBookingMutation();
  const [selected, setSelected] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Partial<Booking> | null>(null);
  const [needFirstTimeEdit, setNeedFirstTimeEdit] = useState(query.edit !== undefined);
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [settingsOpened, setSettingsOpened] = useState<boolean>(false);
  const [settings, setSettings] = useLocalStorage("planningSettings", {
    showPaymentStatus: true,
    monthsToDisplay: 12,
  });
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_booking");
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const canViewContract = user.permissions.includes("core.view_contract");
  // const [manualFetching, setManualFetching] = useState(false);

  // console.log(performance.now().toFixed(2), "Planning", bookings?.length);

  useEffect(() => {
    // console.log(performance.now().toFixed(2), "fetching", IsFetchingBooking);
  }, [IsFetchingBooking])
  // const bookings = allBookings.toModelArray();

  if (needFirstTimeEdit && !editBooking && bookings && bookings.filter(b => b.id === Number(query.edit)).length) {
    console.debug("Open EDIT ", bookings.filter(b => b.id === Number(query.edit)));
    setEditBooking(bookings.filter(b => b.id === Number(query.edit))[0]);
    setNeedFirstTimeEdit(false);
  }

  const onEditBooking = (booking: Booking) => {
    console.debug("EDIT ", booking.id);
    setEditBooking(booking);
  };

  const onCreateBooking = (lodging: Lodging, begin_date: Date) => {
    console.debug("CREATE ", lodging ? lodging.id : null, begin_date);
    if (lodging) {
      setEditBooking({
        lodging_id: lodging.id,
        begin_date: formatISO(begin_date)
      });
    }
  };

  const handleCloseEdit = () => {
    setEditBooking(null);
    setSelected(null);
  };

  const onSelectBooking = (booking: Booking) => {
    console.debug("onSelectBooking", booking);
    setSelected(booking);
  };

  const onDeselectBooking = () => {
    setSelected(null);
  };

  const onCancelBooking = (booking: Booking) => {
    if (!canEdit) return;
    updateBooking({ ...booking, cancelled: true }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error canceling booking", error);
        showError(t("Impossible to cancel booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking cancelled"));
        setEditBooking({ ...booking, cancelled: true });
      }
    });
  };

  const onUncancelBooking = (booking: Booking) => {
    if (!canEdit) return;
    updateBooking({ ...booking, cancelled: false }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error uncancelling booking", error);
        showError(t("Impossible to uncancel booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking uncancelled"));
        setEditBooking({ ...booking, cancelled: false });
      }
    });
  };

  const onDeleteBooking = (booking: Booking) => {
    if(!canDelete) return;
    confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {
        guest_name: booking.guest_name,
        lodging_name: booking.lodging.name
      }),
      description: t("Do you really want to permanently delete this booking?")
    })
      .then(() => {
        setSelected(null);
        deleteBooking(booking.id as number).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting booking", error);
            showError(t("Impossible to delete the booking: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Booking deleted"));
            handleCloseEdit();
          }
        });
      })
      .catch(() => { /* ... */
      });
  };

  const onEditContract = (booking: Booking) => {
    setEditBooking(null);
    // setEditContract(booking);
    navigate("/bookings/" + booking.id + "/contract");
  };

  const onCloseSettings = (newSettings?: PlanningSettings) => {
    setSettingsOpened(false);
    if (typeof newSettings !== "undefined") {
      setSettings(newSettings);
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
      <div className="toolbar">
        <IconButton
          type="button"
          className="delete-button"
          color="secondary"
          onClick={() => onDeleteBooking(selected!)}
          disabled={!canDelete || !selected}
          size="large"
        ><DeleteIcon/></IconButton>
        <IconButton
          type="button"
          color="default"
          onClick={() => onEditContract(selected!)}
          title={t("Contract")}
          disabled={!canViewContract && !selected}
          size="large"
        ><DescriptionIcon/></IconButton>
        <IconButton
          type="submit"
          color="primary"
          onClick={() => onEditBooking(selected!)}
          disabled={!selected}
          size="large"
        ><EditIcon/></IconButton>
        <IconButton
          type="button"
          color="default"
          onClick={() => setSettingsOpened(true)}
          size="large"
        ><SettingsIcon/></IconButton>
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
            startIcon={<DeleteIcon/>}
            onClick={() => onDeleteBooking(selected!)}
            disabled={!selected}
          >{t("Delete")}</Button>
        </Grid>
        <Grid item>
          <Button
            type="button"
            startIcon={<DescriptionIcon/>}
            onClick={() => onEditContract(selected!)}
            title={t("Contract")}
            disabled={!selected}
          >{t("Contract")}</Button>
        </Grid>
        <Grid item>
          <Button
            type="submit"
            color="primary"
            startIcon={<EditIcon/>}
            onClick={() => onEditBooking(selected!)}
            disabled={!selected}
          >{t("Edit booking")}</Button>
        </Grid>
      </Grid>
      {editBooking &&
      <BookingDialogLoader
        booking={editBooking as Booking}
        onClose={handleCloseEdit}
        onOpenContract={onEditContract}
        onCancelBooking={onCancelBooking}
        onUncancelBooking={onUncancelBooking}
        onDelete={onDeleteBooking}
      />}

      <br/>
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
                >{status.name}</span> </span> );
          })}
        </CardContent>
      </Card>
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
