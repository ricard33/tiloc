// import React, { useEffect, useState, useParams } from "react";
import React from "react";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  }
}));

const BookingEdit = () => {
  // const [openAlert, setOpenAlert] = useState(false);
  // const [booking, setBooking] = useState({});
  // // const [loaded, setLoaded] = useState(false);
  // // const [placeholder, setPlaceholder] = useState("Loading");
  // const {id} = useParams();
  const classes = useStyles();
  //
  // const handleCloseAlert = (event, reason) => {
  //   if (reason === 'clickaway') {
  //     return;
  //   }
  //
  //   setOpen(false);
  // };
  //
  // useEffect(() => {
  //   fetch("api/booking/" + id + "/")
  //     .then(response => {
  //       if (response.status > 400) {
  //         return setPlaceholder("Something went wrong!");
  //       }
  //       return response.json();
  //     })
  //     .then(data => {
  //       setBookings(data.results);
  //       // setLoaded(true);
  //     });
  // }, []);

  return (
    <div className={classes.root}>
    </div>
  );
};

export default BookingEdit;
