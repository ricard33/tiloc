import React, { useEffect, useState } from "react";
import BookingsTable from "./components/BookingsTable";
import BookingsToolbar from "./components/BookingsToolbar/BookingsToolbar";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  }
}));

const BookingList = () => {
  const [bookings, setBookings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [placeholder, setPlaceholder] = useState("Loading");

  const classes = useStyles();

  useEffect(() => {
    fetch("api/booking/")
      .then(response => {
        if (response.status > 400) {
          return setPlaceholder("Something went wrong!");
        }
        return response.json();
      })
      .then(data => {
        setBookings(data.results);
        // setLoaded(true);
      });
  }, []);

  return (
    <div className={classes.root}>
      <BookingsToolbar/>
      <div className={classes.content}>
        <BookingsTable bookings={bookings}/>
      </div>
    </div>
  );
};

export default BookingList;
