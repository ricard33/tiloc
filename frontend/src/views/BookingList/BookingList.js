import React, { useEffect, useState } from "react";
import BookingsTable from "./components/BookingsTable";
import BookingsToolbar from "./components/BookingsToolbar/BookingsToolbar";
import { makeStyles } from "@material-ui/styles";
import axios from "axios";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";

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
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  // const [placeholder, setPlaceholder] = useState("Loading");
  const classes = useStyles();

  useEffect(() => {
    axios.get("api/booking/")
      .then(response => {
        setBookings(response.data.results);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  return (
    <div className={classes.root}>
      <BookingsToolbar/>
      <div className={classes.content}>
        <BookingsTable bookings={bookings}/>
        <Backdrop className={classes.backdrop} open={!loaded} timeout={0}>
          <CircularProgress color="inherit"/>
        </Backdrop>
      </div>
    </div>
  );
};

export default BookingList;
