import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import { startOfMonth } from 'date-fns'
import { BookingScheduler } from "./components";
import { bookings as bookingsActions } from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../../selectors";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import { BookingEdit } from "../../components";
import { useTranslation } from "react-i18next";

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
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const loading = useSelector(store => store.fetching.bookings.loading);
  const [ selected, setSelected ] = useState([]);
  const [editBookingId, setEditBookingId] = useState(null);
  const numSelected = selected.length;

  // const bookings = allBookings.toModelArray();

  useEffect(() => {
    dispatch(bookingsActions.fetchBookings());
    // dispatch(bookingsActions.fetchBookingStatuses());
  }, [dispatch]);

  const onEditBooking = (booking) => {
    console.debug("EDIT ", booking.id);
    setEditBookingId(booking.id);
  };

  const handleCloseEdit = () => {
    setEditBookingId(null);
  };

  const bookings2 = bookings.map(booking => ({
    ...booking,
    status: bookingStatuses.filter(s => s.id === booking.status_id)[0],
    lodging: lodgings.filter(l => l.id === booking.lodging_id)[0],
  }));

  return (
    <div className={classes.root}>
      {/*<PlanningToolbar/>*/}
      <BookingScheduler
        bookings={bookings2}
        lodgings={lodgings}
        beginDate={beginDate}
        statuses={bookingStatuses}
        onOpenBooking={onEditBooking}
      />
      <Dialog
        onClose={handleCloseEdit}
        aria-labelledby="simple-dialog-title"
        open={!!editBookingId}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle id="simple-dialog-title">{t("Modify a booking")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("You can change booking details")}
          </DialogContentText>
          <BookingEdit bookingId={editBookingId} onClose={handleCloseEdit}/>
        </DialogContent>
      </Dialog>
    </div>
  );
};

Planning.propTypes = {

};

export default Planning;
