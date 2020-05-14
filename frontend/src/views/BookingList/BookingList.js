import React, { useEffect, useState } from "react";
import { BookingsTable, BookingsToolbar } from "./components";
import { makeStyles } from "@material-ui/styles";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
import { bookings } from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import orm from "orm";
import { BookingEdit } from "components";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import { useTranslation } from "react-i18next";
import DialogContentText from "@material-ui/core/DialogContentText";

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
  const { t } = useTranslation();
  // const allBookings = useSelector(store => selectors.bookings(store));
  const allBookings = useSelector(store => orm.session(store.entities).Booking.all());
  const loading = useSelector(store => store.fetching.bookings.loading);
  const [ selected, setSelected ] = useState([]);
  const [editBooking, setEditBooking] = useState(null);
  const numSelected = selected.length;

  useEffect(() => {
    dispatch(bookings.fetchBookings());
  }, [dispatch]);

  const onSelectionChange = (newSelection) => {
    setSelected(newSelection);
  };

  const onEditBooking = (booking) => {
    setEditBooking(booking);
  };

  const handleCloseEdit = () => {
    setEditBooking(null);
  }

  return (
    <div className={classes.root}>
      <BookingsToolbar numSelected={numSelected}/>
      <div className={classes.content}>
        <BookingsTable
          bookings={allBookings.toModelArray() || []}
          onEdit={onEditBooking}
          onSelectionChange={onSelectionChange}
        />
        <Backdrop className={classes.backdrop} open={loading} timeout={0}>
          <CircularProgress color="inherit"/>
        </Backdrop>
      </div>
      <Dialog onClose={handleCloseEdit} aria-labelledby="simple-dialog-title" open={!!editBooking}>
        <DialogTitle id="simple-dialog-title">{t("Modify a booking")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("You can change booking details")}
          </DialogContentText>
          <BookingEdit bookingInstance={editBooking} onClose={handleCloseEdit} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingList;
