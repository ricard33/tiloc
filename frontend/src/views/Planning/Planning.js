import React, { useEffect, useState } from "react";
import { makeStyles } from "@mui/styles";
import { startOfMonth, parse, add } from "date-fns";
import { BookingScheduler } from "./components";
import { useTranslation } from "react-i18next";
import { useConfirm } from "../../libs/MuiConfirm";
import { useHistory, useLocation } from "react-router-dom";
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
import PlanningSettingsDialog from "./components/PlanningSettingsDialog";
import {
  useDeleteBookingMutation,
  useListBookingsQuery,
  useListBookingStatusesQuery,
  useListLodgingsQuery
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  toolbar: {
    textAlign: "right"
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  },
  deleteButton: {
    color: "red"
  },
  statusLegend: {
    border: "solid 1px",
    fontSize: "x-small",
    margin: "5px",
    padding: "0 4px"
  }
}));

const Planning = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const location = useLocation();
  const query = queryString.parse(location.search);
  let requestedDate = parse(query.start, "yyyy-MM", new Date());
  if (isNaN(requestedDate))
    requestedDate = new Date();

  const { showError, showSuccess } = useAlert();
  const [beginDate, setBeginDate] = useState(startOfMonth(requestedDate));
  const dateFilter = formatISO(beginDate) + ":" + formatISO(add(beginDate, {years: 1}))
  const { data: bookings, isLoading: isLoadingBookings, isFetching: IsFetchingBooking } = useListBookingsQuery({for_dates: dateFilter}, {pollingInterval: 60000});
  const { data: lodgings } = useListLodgingsQuery({ shown: true });
  const { data: bookingStatuses } = useListBookingStatusesQuery();
  const [ deleteBooking ] = useDeleteBookingMutation();
  const [selected, setSelected] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const [needFirstTimeEdit, setNeedFirstTimeEdit] = useState(query.edit !== undefined);
  const history = useHistory();
  const confirm = useConfirm();
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [settings, setSettings] = useLocalStorage("planningSettings", { showPaymentStatus: true });
  // const [manualFetching, setManualFetching] = useState(false);

  console.log(performance.now().toFixed(2), "Planning", bookings?.length);

  useEffect(() => {
    console.log(performance.now().toFixed(2), "fetching", IsFetchingBooking);
  }, [IsFetchingBooking])
  // const bookings = allBookings.toModelArray();

  if (needFirstTimeEdit && !editBooking && bookings && bookings.filter(b => b.id === Number(query.edit)).length) {
    console.debug("Open EDIT ", bookings.filter(b => b.id === Number(query.edit)));
    setEditBooking(bookings.filter(b => b.id === Number(query.edit))[0]);
    setNeedFirstTimeEdit(false);
  }

  const onEditBooking = (booking) => {
    console.debug("EDIT ", booking.id);
    setEditBooking(booking);
  };

  const onCreateBooking = (lodging, begin_date) => {
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

  const onSelectBooking = (booking) => {
    console.debug("onSelectBooking", booking);
    setSelected(booking);
  };

  const onDeselectBooking = () => {
    setSelected(null);
  };

  const onDeleteBooking = (booking) => {
    confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {
        guest_name: booking.guest_name,
        lodging_name: booking.lodging.name
      }),
      description: t("Do you really want to permanently delete this booking?")
    })
      .then(() => {
        setSelected(null);
        deleteBooking(booking.id).then((result) => {
          if (result.error) {
            const error = result.error;
            console.error("Error deleting booking", error);
            showError(t("Impossible to delete the booking: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Booking deleted"));
          }
        });
      })
      .catch(() => { /* ... */
      });
  };

  const onEditContract = (booking) => {
    setEditBooking(null);
    // setEditContract(booking);
    history.push("/bookings/" + booking.id + "/contract");
  };

  const onCloseSettings = (newSettings) => {
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
    <div className={classes.root}>
      <div className={classes.toolbar}>
        <IconButton
          type="button"
          className={classes.deleteButton}
          color="secondary"
          onClick={() => onDeleteBooking(selected)}
          disabled={!selected}
          size="large"
        ><DeleteIcon/></IconButton>
        <IconButton
          type="button"
          color="default"
          onClick={() => onEditContract(selected)}
          title={t("Contract")}
          disabled={!selected}
          size="large"
        ><DescriptionIcon/></IconButton>
        <IconButton
          type="submit"
          color="primary"
          onClick={() => onEditBooking(selected)}
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
        onCreateBooking={onCreateBooking}
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
            className={classes.deleteButton}
            color="secondary"
            startIcon={<DeleteIcon/>}
            onClick={() => onDeleteBooking(selected)}
            disabled={!selected}
          >{t("Delete")}</Button>
        </Grid>
        <Grid item>
          <Button
            type="button"
            startIcon={<DescriptionIcon/>}
            onClick={() => onEditContract(selected)}
            title={t("Contract")}
            disabled={!selected}
          >{t("Contract")}</Button>
        </Grid>
        <Grid item>
          <Button
            type="submit"
            color="primary"
            startIcon={<EditIcon/>}
            onClick={() => onEditBooking(selected)}
            disabled={!selected}
          >{t("Edit booking")}</Button>
        </Grid>
      </Grid>
      {editBooking &&
      <BookingDialogLoader
        booking={editBooking}
        onClose={handleCloseEdit}
        onOpenContract={onEditContract}
      />}

      <br/>
      <Card className={classes.root}>
        <CardContent>
          <Typography variant="h5" component="h2">
            {t("Legend")}
          </Typography>
          {bookingStatuses && bookingStatuses.map(status => {
            return (
              <span
                key={status.id}
                className={classes.statusLegend}
                style={{ background: "#" + status.color }}
              >{status.name}</span>);
          })}
        </CardContent>
      </Card>
      <div>Legend: TODO</div>
      {settingsOpened &&
      <PlanningSettingsDialog
        open={settingsOpened}
        settings={settings}
        onClose={onCloseSettings}
      />}
    </div>
  );
};

Planning.propTypes = {};

export default Planning;
