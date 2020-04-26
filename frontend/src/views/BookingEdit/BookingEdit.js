import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/styles";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, Divider, Grid, TextField } from "@material-ui/core";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import { useDispatch, useSelector } from "react-redux";
import { useParams} from "react-router-dom";
import * as actions from "../../actions";
import * as selectors from "../../selectors";
import orm from "../../orm";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  formControl: {
    width: "100%"
  }
}));

const BookingEdit = props => {
  console.log(props);
  const { className } = props;
  const { t } = useTranslation();
  const { id } = useParams();
  const { register, handleSubmit, errors } = useForm(); // initialise the hook
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const lodgings = useSelector(store => selectors.lodgings(store));
  const booking = useSelector(store => orm.session(store.entities).Booking.withId(id));
  const loading = useSelector(store => store.fetching.bookings.loading | store.fetching.booking_statuses.loading);
  const allGuests = useSelector(store => selectors.guests(store));
  const dispatch = useDispatch();
  const classes = useStyles();
  const variant = "filled";

  useEffect(() => {
    dispatch(actions.fetchBookings());
    dispatch(actions.fetchBookingStatuses());
    dispatch(actions.fetchLodgings());
  }, [dispatch]);


  const handleStatusChange = data => {
    console.log(data);
  };
  const handleLodgingChange = data => {
    console.log(data);
  };
  const handleGuestChange = data => {
    console.log(data);
  };
  const onSubmit = data => {
    console.log(data);
  };


  if(loading || !booking)
    return <p>Loading...</p>;
  return (
    <Card
      className={clsx(classes.root, className)}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardHeader
          subheader={t("You can change booking details")}
          title={t("Modify a booking")}
        />
        <Divider/>
        <CardContent>
          <Grid
            container
            spacing={3}
          >
            <Grid
              item
              md={4}
              xs={12}
            >
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="booking-status">{t("Booking status")}</InputLabel>
                <Select
                  label={t("Booking status")}
                  inputProps={{
                    name: "status",
                    id: "booking-status"
                  }}
                  margin="dense"
                  native
                  onChange={handleStatusChange}
                  ref={register}
                  value={booking.status.id}
                >
                  {bookingStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              item
              md={8}
              xs={12}
            >
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="booking-status">{t("Lodging")}</InputLabel>
                <Select
                  label={t("Lodging")}
                  inputProps={{
                    name: "lodging",
                    id: "booking-lodging"
                  }}
                  margin="dense"
                  native
                  onChange={handleLodgingChange}
                  ref={register}
                  value={booking.lodging.id}
                >
                  {lodgings.map(lodging => (
                    <option key={lodging.id} value={lodging.id}>{lodging.name}</option>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              item
              xs={12}
            >
              <Typography variant="h6" gutterBottom>{t("Guest")}</Typography>
            </Grid>
            <Grid
              item
              xs={12}
            >
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="booking-existing-guest">{t("Existing guest")}</InputLabel>
                <Select
                  label={t("Existing guest")}
                  inputProps={{
                    name: "existing-guest",
                    id: "booking-existing-gest"
                  }}
                  margin="dense"
                  native
                  onChange={handleGuestChange}
                  ref={register}
                  value={booking.guest_name}
                >
                  {allGuests.map(guest => (
                    <option key={guest} value={guest}>{guest}</option>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid
              item
              xs={12}
            >
              <TextField
                fullWidth
                helperText="Please specify the guest name"
                label="Guest name"
                margin="dense"
                name="guestName"
                // onChange={handleChange}
                ref={register}
                required
                value={booking.guest_name}
                variant={variant}
              />
              <TextField
                fullWidth
                // helperText="Please specify the guest phone and/or email"
                label="Phone / email"
                margin="dense"
                multiline
                name="guestContact"
                // onChange={handleChange}
                ref={register}
                value={booking.guest_contact}
                variant={variant}
              />
              <TextField
                fullWidth
                // helperText="Full guest address"
                label="Address"
                margin="dense"
                multiline
                name="guestAddress"
                // onChange={handleChange}
                ref={register}
                value={booking.guest_address}
                variant={variant}
              />
            </Grid>
          </Grid>
        </CardContent>
      </form>
    </Card>
  );
};

BookingEdit.propTypes = {
  className: PropTypes.string
};

export default BookingEdit;
