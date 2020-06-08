import React from "react";
import { makeStyles } from "@material-ui/styles";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
// import DialogContentText from "@material-ui/core/DialogContentText";
import { BookingEdit } from "../index";
import { bookingType } from "../../common/propTypesUtils";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import { Save as SaveIcon } from "@material-ui/icons";
// import { Grid } from "@material-ui/core";
import * as actions from "../../actions";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";


const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(1)
  },
  content: {
    marginTop: theme.spacing(2)
  },
}));

const BookingDialog = props => {
  const { className, booking, onClose } = props;
  const classes = useStyles();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const form = useForm(); // initialise the hook

  const onCancel = () => {
    onClose();
  };

  const onSubmit = data => {
    console.log("Submit: ", data);
    const submittedBooking = {
      ...booking,
      ...data
    };
    dispatch(actions.updateBooking(submittedBooking, () => {
      // history.goBack();
      console.debug("Closing...");
      onClose(submittedBooking);
    }));
  };

  return (
    <Dialog
      className={clsx(classes.root, className)}
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={!!booking}
      maxWidth="sm"
      // fullWidth
    >
      <DialogTitle id="simple-dialog-title">
        {booking && booking.id ? t("Modify a booking") : t("Add a booking")}
      </DialogTitle>
      <DialogContent>
        {/*<DialogContentText>*/}
        {/*  {booking && booking.id ?*/}
        {/*    t("You can change booking details") : t("You can create a new booking") }*/}
        {/*</DialogContentText>*/}
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <BookingEdit bookingInstance={booking} form={form}/>
        </form>
      </DialogContent>
      <DialogActions>
        <Button type="button" color="default" onClick={onCancel}>{t("Cancel")}</Button>
        <Button
          type="submit"
          color="primary"
          className={classes.button}
          startIcon={<SaveIcon/>}
          onClick={form.handleSubmit(onSubmit)}
        >{t("Save")}</Button>
      </DialogActions>
    </Dialog>

  );
};

BookingDialog.propTypes = {
  booking: bookingType,
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired
};

export default BookingDialog;
