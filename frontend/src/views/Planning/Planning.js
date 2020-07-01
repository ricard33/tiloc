import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import { startOfMonth } from 'date-fns'
import { BookingScheduler } from "./components";
import { bookings as bookingsActions, lodgings as lodgingsActions } from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../../selectors";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { BookingDialog } from "../../components";

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
  const bookingChannels = useSelector(store => selectors.bookingChannels(store));
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const [ selected, setSelected ] = useState([]);
  const [editBooking, setEditBooking] = useState(null);
  const numSelected = selected.length;

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
    if(lodging) {
      setEditBooking({
        lodging_id: lodging.id,
        begin_date: moment(begin_date).toISOString().substr(0, 10),
      });
    }
  };

  const handleCloseEdit = () => {
    setEditBooking(null);
  };

  const bookings2 = bookings.map(booking => ({
    ...booking,
    status: bookingStatuses.filter(s => s.id === booking.status_id)[0],
    lodging: lodgings.filter(l => l.id === booking.lodging_id)[0],
    source: booking.source_id ? bookingChannels.filter(c => c.id === booking.source_id)[0] : undefined,
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
      />
      {editBooking && <BookingDialog
        booking={editBooking}
        onClose={handleCloseEdit}
        // open={!!editBooking || newBooking}
      />}
    </div>
  );
};

Planning.propTypes = {

};

export default Planning;
