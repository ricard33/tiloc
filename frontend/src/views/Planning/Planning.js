import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import { startOfMonth } from 'date-fns'
import { BookingScheduler } from "./components";
import { bookings as bookingsActions } from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import * as selectors from "../../selectors";

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
  const dispatch = useDispatch();
  const [beginDate, setBeginDate] = useState(startOfMonth(new Date()));
  // const allBookings = useSelector(store => orm.session(store.entities).Booking.all());
  const bookings = useSelector(store => selectors.bookings(store));
  const lodgings = useSelector(store => selectors.lodgings(store));
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const loading = useSelector(store => store.fetching.bookings.loading);
  const [ selected, setSelected ] = useState([]);
  const numSelected = selected.length;

  // const bookings = allBookings.toModelArray();

  useEffect(() => {
    dispatch(bookingsActions.fetchBookings());
    // dispatch(bookingsActions.fetchBookingStatuses());
  }, [dispatch]);


  return (
    <div className={classes.root}>
      {/*<PlanningToolbar/>*/}
      <BookingScheduler
        bookings={bookings}
        lodgings={lodgings}
        beginDate={beginDate}
        statuses={bookingStatuses}
      />
    </div>
  );
};

Planning.propTypes = {

};

export default Planning;
