import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import { startOfMonth } from "date-fns";
import { BookingScheduler } from "./components";
import * as actions from "../../actions";
import { bookings as bookingsActions, lodgings as lodgingsActions } from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../../selectors";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { BookingDialog } from "../../components";
import { useConfirm } from "material-ui-confirm";
import { useHistory } from "react-router-dom";
import { Grid } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { DeleteForever as DeleteIcon, Description as DescriptionIcon, Edit as EditIcon } from "@material-ui/icons";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  },
  deleteButton: {
    color: "red"
  }
}));

const Planning = props => {
  const classes = useStyles();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [beginDate, setBeginDate] = useState(startOfMonth(new Date()));
  // const allBookings = useSelector(store => orm.session(store.entities).Booking.all());
  const bookings = useSelector(store => selectors.bookings(store));
  const lodgings = useSelector(store => selectors.lodgings(store));
  const bookingChannels = useSelector(store => selectors.bookingChannels(store));
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const [selected, setSelected] = useState(null);
  const [editBooking, setEditBooking] = useState(null);
  const history = useHistory();
  const confirm = useConfirm();

  // const bookings = allBookings.toModelArray();

  useEffect(() => {
    dispatch(bookingsActions.fetchBookings());
    dispatch(bookingsActions.fetchBookingStatuses());
    dispatch(bookingsActions.fetchBookingChannels());
    dispatch(lodgingsActions.fetchLodgings());
  }, [dispatch]);

  const onEditBooking = (booking) => {
    console.debug("EDIT ", booking.id);
    setEditBooking(booking);
  };

  const onCreateBooking = (lodging, begin_date) => {
    console.debug("CREATE ", lodging ? lodging.id : null, begin_date.toISOString());
    if (lodging) {
      setEditBooking({
        lodging_id: lodging.id,
        begin_date: moment(begin_date).toISOString().substr(0, 10)
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

  const onDeselectBooking = (booking) => {
    setSelected(null);
  };

  const onDeleteBooking = (booking) => {
    confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {guest_name: booking.guest_name, lodging_name: booking.lodging.name}),
      description: t("Do you really want to permanently delete this booking?")
    })
      .then(() => {
        setSelected(null);
        dispatch(actions.deleteBooking(booking.id, () => {}));
      })
      .catch(() => { /* ... */
      });
  };

  const onEditContract = (booking) => {
    setEditBooking(null);
    // setEditContract(booking);
    history.push("/bookings/" + booking.id + "/contract");
  };

  const bookings2 = bookings.map(booking => ({
    ...booking,
    status: bookingStatuses.filter(s => s.id === booking.status_id)[0],
    lodging: lodgings.filter(l => l.id === booking.lodging_id)[0],
    source: booking.source_id ? bookingChannels.filter(c => c.id === booking.source_id)[0] : undefined
  }));

  return (
    <div className={classes.root}>
      {/*<PlanningToolbar/>*/}
      <BookingScheduler
        bookings={bookings2}
        lodgings={lodgings}
        beginDate={beginDate}
        statuses={bookingStatuses}
        onCreateBooking={onCreateBooking}
        onOpenBooking={onEditBooking}
        onItemSelected={onSelectBooking}
        onItemDeselected={onDeselectBooking}
      />
      <Grid container xs={12} justify="space-between" alignItems="flex-start">
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
            color="default"
            className={classes.button}
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
            className={classes.button}
            startIcon={<EditIcon/>}
            onClick={() => onEditBooking(selected)}
            disabled={!selected}
          >{t("Edit booking")}</Button>
        </Grid>
      </Grid>
      {editBooking && <BookingDialog
        booking={editBooking}
        onClose={handleCloseEdit}
        onOpenContract={onEditContract}
      />}
    </div>
  );
};

Planning.propTypes = {};

export default Planning;
