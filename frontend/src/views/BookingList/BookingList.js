import React, { useEffect } from "react";
import BookingsTable from "./components/BookingsTable";
import BookingsToolbar from "./components/BookingsToolbar/BookingsToolbar";
import { makeStyles } from "@material-ui/styles";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
import {bookings} from "../../actions";
import { useDispatch, useSelector } from "react-redux";

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

const BookingList = () => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const allBookings = useSelector(store => store.bookings);

  useEffect(() => {
    dispatch(bookings.fetchBookings());
  }, [dispatch]);

  return (
    <div className={classes.root}>
      <BookingsToolbar/>
      <div className={classes.content}>
        <BookingsTable bookings={allBookings.data ||[]}/>
        <Backdrop className={classes.backdrop} open={allBookings.loading} timeout={0}>
          <CircularProgress color="inherit"/>
        </Backdrop>
      </div>
    </div>
  );
};

export default BookingList;
