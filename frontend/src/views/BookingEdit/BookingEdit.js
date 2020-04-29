import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, Divider, Grid, TextField } from "@material-ui/core";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import * as actions from "../../actions";
import * as selectors from "../../selectors";
import orm from "../../orm";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import FormHelperText from "@material-ui/core/FormHelperText";
import {
  Contacts as ContactsIcon,
  NightsStay as NightsStayIcon,
  Forward as ForwardIcon
} from "@material-ui/icons";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import DateFnsUtils from "@date-io/date-fns";
import {
  MuiPickersUtilsProvider,
  KeyboardDatePicker
} from "@material-ui/pickers";
import { shiftPickerDateToUTCDate, shiftUTCDateToPickerDate } from "../../common/tzUtils";


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
  const { className } = props;
  const { t } = useTranslation();
  const { id } = useParams();
  const { register, handleSubmit, control, errors } = useForm(); // initialise the hook
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const lodgings = useSelector(store => selectors.lodgings(store));
  const bookingInstance = useSelector(store => orm.session(store.entities).Booking.withId(id));
  const loading = useSelector(store => store.fetching.bookings.loading | store.fetching.booking_statuses.loading);
  const allGuests = useSelector(store => selectors.guests(store));
  const dispatch = useDispatch();
  const classes = useStyles();
  const variant = "standard";
  let statusColor = {};
  const [booking, setBooking] = useState({});

  if (Object.keys(booking).length === 0 && booking.constructor === Object
    && bookingInstance && bookingInstance.ref) { // HACK to handle delayed load
    console.debug("Load state with ", bookingInstance.ref);
    setBooking({
      ...bookingInstance.ref,
      // begin_date: parseISO()
    });
  }
  // console.log(booking);

  if (bookingStatuses.length > 0 && booking.status) {
    // console.debug(bookingStatuses, booking.status);
    // console.debug(bookingStatuses.filter(status => status.id === booking.status));
    statusColor = {
      background: "#" + bookingStatuses.filter(status => status.id === booking.status)[0].color
    };
  }

  useEffect(() => {
    dispatch(actions.fetchBookings());
    dispatch(actions.fetchBookingStatuses());
    dispatch(actions.fetchLodgings());
  }, [dispatch]);


  const handleChange = data => {
    console.debug(data);
    console.debug(data.target);
    switch (data.target.name) {
      case "status":
        setBooking({ ...booking, status: parseInt(data.target.value, 10) });
        break;
      case "lodging":
        setBooking({ ...booking, lodging: parseInt(data.target.value, 10) });
        break;
      case "existing-guest":
        const guest = allGuests.filter(guest => guest.name === data.target.value);
        if (guest) {
          setBooking({
            ...booking,
            guest_name: guest[0].name,
            guest_contact: guest[0].contact,
            guest_address: guest[0].address
          });
        }
        break;
      case "duration":
        onDurationChange(data.target.value);
        break;
    }
  };

  function onDurationChange(newValue) {
    setBooking({
      ...booking,
      duration: Number(newValue),
      end_date: format(addDays(parseISO(booking.begin_date), newValue), "yyyy-MM-dd")
    });
  }

  const handleNightsSliderChange = (event, newValue) => {
    onDurationChange(newValue);
  };

  const onDateChange = (newDate, fieldName) => {
    console.debug(newDate);
    console.debug(format(newDate, "yyyy-MM-dd"));
    const duration = fieldName === "begin_date" ?
      differenceInCalendarDays(parseISO(booking.end_date), newDate)
      : differenceInCalendarDays(newDate, parseISO(booking.begin_date));
    setBooking({
      ...booking,
      [fieldName]: format(newDate, "yyyy-MM-dd"),
      duration: duration,
    });
  };
  const handleBeginDateChange = newDate => onDateChange(newDate, "begin_date");
  const handleEndDateChange = newDate => onDateChange(newDate, "end_date");

  const onSubmit = data => {
    console.log(data);
  };

  const marks = [
    { value: 1, label: "1" },
    { value: 7, label: "7" },
    { value: 14, label: "14" },
    { value: 30, label: "30" },
    { value: 60, label: "60" },
    { value: 100, label: "100" }
  ];

  if (loading || !booking)
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
            <Grid item sm={4} xs={12}>
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="booking-status">{t("Booking status")}</InputLabel>
                <Select
                  label={t("Booking status")}
                  inputProps={{
                    id: "booking-status",
                    name: "status"
                  }}
                  margin="dense"
                  native
                  onChange={handleChange}
                  ref={register}
                  style={statusColor}
                  value={booking.status}
                >
                  {bookingStatuses.map(status => (
                    <option key={status.id} value={status.id}>{status.name}</option>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item sm={8} xs={12}>
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="booking-status">{t("Lodging")}</InputLabel>
                <Select
                  label={t("Lodging")}
                  inputProps={{
                    id: "booking-lodging",
                    name: "lodging"
                  }}
                  margin="dense"
                  native
                  onChange={handleChange}
                  ref={register}
                  value={booking.lodging}
                >
                  {lodgings.map(lodging => (
                    <option key={lodging.id} value={lodging.id}>{lodging.name}</option>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom variant="h6">{t("Guest")}</Typography>
            </Grid>
            <Grid item xs={1}>
              <ContactsIcon/>
            </Grid>
            <Grid item xs={11}>
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
                  onChange={handleChange}
                  ref={register}
                  value={booking.guest_name}
                >
                  {allGuests.map(guest => (
                    <option key={guest.name} value={guest.name}>{guest.name}</option>
                  ))}
                </Select>
                <FormHelperText>{t("Select an existing guest to automatically fill its information")}</FormHelperText>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                helperText={t("Please specify the guest name")}
                label={t("Guest name")}
                margin="dense"
                name="guestName"
                onChange={handleChange}
                inputRef={register}
                required
                value={booking.guest_name}
                variant={variant}
              />
            </Grid>
            <Grid item sm={6} xs={12}>
              <TextField
                fullWidth
                // helperText={t("Please specify the guest phone and/or email")}
                label={t("Phone / email")}
                margin="dense"
                multiline
                name="guestContact"
                onChange={handleChange}
                inputRef={register}
                value={booking.guest_contact}
                variant={variant}
              />
            </Grid>
            <Grid item sm={6} xs={12}>
              <TextField
                fullWidth
                // helperText={t("Full guest address")}
                label={t("Address")}
                margin="dense"
                multiline
                name="guestAddress"
                onChange={handleChange}
                inputRef={register}
                value={booking.guest_address}
                variant={variant}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom variant="h6">{t("Booking details")}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography id="input-slider" gutterBottom>
                {t("Nights")}
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item>
                  <NightsStayIcon/>
                </Grid>
                <Grid item xs>
                  <Slider
                    aria-labelledby="continuous-slider"
                    name="duration-slider"
                    onChange={handleNightsSliderChange}
                    step={1}
                    value={typeof booking.duration === "number" ? booking.duration : 1}
                    valueLabelDisplay="on"
                    marks={marks}
                    min={1}
                  />
                </Grid>
                <Grid item>
                  <Input
                    className={classes.input}
                    onChange={handleChange}
                    // onBlur={handleNightsBlur}
                    inputProps={{
                      step: 1,
                      min: 1,
                      max: 100,
                      type: "number",
                      "aria-labelledby": "input-slider"
                    }}
                    margin="dense"
                    name="duration"
                    value={booking.duration}
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container justify="space-around" alignItems="center">
                  <Grid item sm={5} xs={6}>
                    <KeyboardDatePicker
                      format="dd/MM/yyyy"
                      id="date-picker-inline"
                      KeyboardButtonProps={{
                        "aria-label": "arrival date"
                      }}
                      label={t("Arrival")}
                      margin="dense"
                      onChange={date => handleBeginDateChange(shiftPickerDateToUTCDate(date))}
                      value={shiftUTCDateToPickerDate(booking.begin_date)}
                    />
                  </Grid>
                  <Grid item sm={2} xs={12}>
                    <ForwardIcon/>
                  </Grid>
                  <Grid item sm={5} xs={6}>
                    <KeyboardDatePicker
                      format="dd/MM/yyyy"
                      id="date-picker-dialog"
                      KeyboardButtonProps={{
                        "aria-label": "departure date"
                      }}
                      label={t("Departure")}
                      margin="dense"
                      onChange={date => handleEndDateChange(shiftPickerDateToUTCDate(date))}
                      value={shiftUTCDateToPickerDate(booking.end_date)}
                    />
                  </Grid>
                </Grid>
              </MuiPickersUtilsProvider>
            </Grid>
            <Grid item xs={12}>
              <input type="submit"/>
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
