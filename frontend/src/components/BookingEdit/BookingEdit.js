import React, { useEffect, useState } from "react";
import { makeStyles } from "@material-ui/styles";
import { Controller, useForm } from "react-hook-form";
import { Card, Grid, TextField } from "@material-ui/core";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import { useDispatch, useSelector } from "react-redux";
import * as actions from "../../actions";
import * as selectors from "../../selectors";
import PropTypes from "prop-types";
import Typography from "@material-ui/core/Typography";
import Slider from "@material-ui/core/Slider";
import Input from "@material-ui/core/Input";
import FormHelperText from "@material-ui/core/FormHelperText";
import {
  Contacts as ContactsIcon,
  Forward as ForwardIcon,
  NightsStay as NightsStayIcon,
  Save as SaveIcon
} from "@material-ui/icons";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import DateFnsUtils from "@date-io/date-fns";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import { shiftPickerDateToUTCDate, shiftUTCDateToPickerDate } from "../../common/tzUtils";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import { computeBookingPrice, DecimalPrecision } from "../../common/priceUtils";
import InputAdornment from "@material-ui/core/InputAdornment";
import { getDepositLabel } from "../../common/ownerPrefsUtils";
import Button from "@material-ui/core/Button";
import { bookingType } from "../../common/propTypesUtils";
import MenuItem from "@material-ui/core/MenuItem";


const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(1)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  formControl: {
    width: "100%"
  },
  flexBoxAlignLeft: {
    display: "flex",
    alignItems: "baseline"
    // justifyContent: "stretch"
  },
  flexBoxStretched: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between"
  },
  spacer: {
    flexBasis: "2em"
  },
  button: {
    margin: theme.spacing(1)
  },
  statusItem: {
    width: "-webkit-fill-available"
    // width: "stretch",
    // padding: theme.spacing(1)
    // height: "1em",
    // marginRight: "5px"
  }
}));

const BookingEdit = props => {
  const { bookingInstance, form } = props;
  const { t } = useTranslation();
  const { register, control, errors } = form;
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const bookingChannels = useSelector(store => selectors.bookingChannels(store));
  const lodgings = useSelector(store => selectors.lodgings(store));
  const owners = useSelector(store => selectors.owners(store));
  const loading = useSelector(store => store.fetching.bookings.loading | store.fetching.booking_statuses.loading);
  const allGuests = useSelector(store => selectors.guests(store));
  const dispatch = useDispatch();
  const classes = useStyles();
  const variant = "outlined";
  const depositPercent = 30; // TODO load this from owner or lodging prefs

  let initialState = {};
  console.debug("bookingInstance", bookingInstance);
  if (bookingInstance) {
    initialState = {
      ...bookingInstance,
      status: { ...bookingStatuses.filter(x => x.id === bookingInstance.status_id)[0] },
      lodging: { ...lodgings.filter(x => x.id === bookingInstance.lodging_id)[0] },
      source: { ...bookingChannels.filter(x => x.id === bookingInstance.source_id)[0] }
    };
    // Provide defaults for new bookings
    if (initialState.status_id === undefined) {
      initialState.status_id = bookingStatuses[0].id;
      initialState.status = bookingStatuses[0];
    }
    if (initialState.begin_date === undefined)
      initialState.begin_date = format(new Date(), "yyyy-MM-yy");
    if (initialState.end_date === undefined)
      initialState.end_date = format(addDays(parseISO(initialState.begin_date), initialState.duration || 7), "yyyy-MM-dd");
    if (initialState.duration === undefined)
      initialState.duration = differenceInCalendarDays(parseISO(initialState.end_date), parseISO(initialState.begin_date));
    if (initialState.daily_rate === undefined)
      initialState.daily_rate = initialState.lodging.daily_rate;
    if (initialState.is_flate_rate === undefined)
      initialState.is_flate_rate = false;
    if (initialState.price === undefined)
      Object.assign(initialState, computeBookingPrice(initialState.begin_date, initialState.end_date,
        initialState.daily_rate, 0, 0, [], depositPercent));
    if (initialState.guaranty === undefined)
      initialState.guaranty = initialState.lodging.guaranty;

  }

  const [booking, setBooking] = useState(initialState);
  const depositLabel = getDepositLabel(t, booking && booking.lodging && booking.lodging.owner && booking.lodging.owner.deposit_label) || t("Deposit");
  console.debug("booking", booking);
  console.debug("lodging", lodgings);

  useEffect(() => {
    dispatch(actions.fetchBookings());
    dispatch(actions.fetchBookingStatuses());
    dispatch(actions.fetchBookingChannels());
    dispatch(actions.fetchLodgings());
    dispatch(actions.fetchOwners());
  }, [dispatch]);

  const handleChange = data => {
    // console.debug(data);
    // console.debug(data.target);
    let value = data.target.value;
    switch (data.target.name) {
      case "status": {
        const status = bookingStatuses.filter(x => x.id === Number(data.target.value))[0];
        setBooking({ ...booking, status: status, status_id: status.id });
        break;
      }
      case "lodging": {
        const lodging = lodgings.filter(x => x.id === Number(data.target.value))[0];
        setBooking({ ...booking, lodging: lodging, lodging_id: lodging.id});
        break;
      }
      case "existing-guest":
        console.log("existing-guest");
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
      case "guest_name":
      case "guest_contact":
      case "guest_address":
      case "special_conditions":
        setBooking({ ...booking, [data.target.name]: data.target.value });
        break;
      case "duration":
        onDurationChange(data.target.value);
        break;
      case "daily-rate":
        value = Number(data.target.value);
        setBooking({
          ...booking,
          ...computeBookingPrice(booking.begin_date, booking.end_date, value, 0, 0, [], depositPercent)
        });
        break;
      case "price":
        value = Number(data.target.value);
        setBooking({
          ...booking,
          daily_rate: DecimalPrecision.round(value / booking.duration),
          price: value,
          price_details: undefined,
          is_flat_rate: true
        });
        break;
      case "flat-rate":
        if (data.target.checked)
          setBooking({ ...booking, is_flat_rate: true });
        else
          setBooking({
            ...booking,
            ...computeBookingPrice(booking.begin_date, booking.end_date, booking.lodging.daily_rate, 0, 0, [], depositPercent),
            is_flat_rate: false
          });
        break;
      case "deposit":
        if (!data.target.value)
          setBooking({ ...booking, deposit: 0 });
        else {
          let deposit = Number(data.target.value);
          if (deposit && deposit >= 0) {
            if (deposit > booking.price)
              deposit = booking.price;
            setBooking({ ...booking, deposit });

          }
        }
        break;
      case "adults":
      case "children":
      case "babies":
        setBooking({ ...booking, [data.target.name]: Number(data.target.value) });
        break;
      case "source":
        value = Number(data.target.value) > 0 ? data.target.value : null;
        setBooking({ ...booking, [data.target.name]: Number(data.target.value) });
        break;
      default:
        console.warn("Unhandled input:", data.target.name);
    }
  };

  function onDurationChange(newValue) {
    const duration = Number(newValue);
    const endDate = format(addDays(parseISO(booking.begin_date), duration), "yyyy-MM-dd");
    const priceObj = booking.is_flat_rate ? { daily_rate: booking.price / duration }
      : computeBookingPrice(booking.begin_date, endDate, booking.lodging.daily_rate, 0, 0, [], depositPercent);
    setBooking({
      ...booking,
      ...priceObj,
      duration: duration,
      end_date: endDate
    });
  }

  const handleNightsSliderChange = (event, newValue) => {
    onDurationChange(newValue);
  };

  const onDateChange = (newDate, fieldName) => {
    console.debug(newDate);
    console.debug(format(newDate, "yyyy-MM-dd"));
    const newBooking = {
      ...booking,
      [fieldName]: format(newDate, "yyyy-MM-dd")
    };
    const duration = differenceInCalendarDays(parseISO(booking.end_date), parseISO(booking.begin_date));
    const priceObj = booking.is_flat_rate ? { daily_rate: booking.price / duration }
      : computeBookingPrice(booking.begin_date, booking.end_date, booking.lodging.daily_rate, 0, 0, [], depositPercent);
    setBooking({
      ...newBooking,
      ...priceObj,
      duration: duration
    });
  };
  const handleBeginDateChange = newDate => onDateChange(newDate, "begin_date");
  const handleEndDateChange = newDate => onDateChange(newDate, "end_date");

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
    <Grid
      container
      spacing={1}
    >
      <Grid item sm={4} xs={12}>
        <FormControl className={classes.formControl} variant={variant}>
          <InputLabel htmlFor="status_id">{t("Booking status")}</InputLabel>
          <Controller
            as={Select}
            name="status_id"
            control={control}
            // inputProps={{
            //   id: "booking-status",
            //   name: "status"
            // }}
            label={t("Booking status")}
            margin="dense"
            // onChange={([event]) => handleChange(event)}
            onChange={([event]) => event.target.value}
            // value={booking.status_id}
            defaultValue={booking.status_id}
            // ref={register}≥
          >
            {bookingStatuses.map(status => (
              <MenuItem key={status.id} value={status.id}>
                <span
                  className={classes.statusItem}
                  style={{ background: "#" + status.color }}
                >{status.name}</span>
              </MenuItem>
            ))}
          </Controller>
        </FormControl>
      </Grid>
      <Grid item sm={8} xs={12}>
        <FormControl className={classes.formControl} variant={variant}>
          <InputLabel htmlFor="booking-lodging">{t("Lodging")}</InputLabel>
          <Select
            inputProps={{
              id: "booking-lodging",
              name: "lodging"
            }}
            label={t("Lodging")}
            margin="dense"
            native
            onChange={handleChange}
            ref={register}
            value={booking.lodging_id}
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
            inputProps={{
              name: "existing-guest",
              id: "booking-existing-gest"
            }}
            label={t("Existing guest")}
            margin="dense"
            native
            onChange={handleChange}
            ref={register}
            value={booking.guest_name}
          >
            <option key={0} value={0}>{t("-- Choose --")}</option>
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
          // helperText={t("Please specify the guest name")}
          inputRef={register}
          label={t("Full guest name")}
          margin="dense"
          name="guest_name"
          onChange={handleChange}
          required
          value={booking.guest_name}
          variant={variant}
        />
      </Grid>
      <Grid item sm={6} xs={12}>
        <TextField
          fullWidth
          // helperText={t("Please specify the guest phone and/or email")}
          inputRef={register}
          label={t("Phone / email")}
          margin="dense"
          multiline
          rows={2}
          name="guest_contact"
          onChange={handleChange}
          value={booking.guest_contact}
          variant={variant}
        />
      </Grid>
      <Grid item sm={6} xs={12}>
        <TextField
          fullWidth
          // helperText={t("Full guest address")}
          inputRef={register}
          label={t("Address")}
          margin="dense"
          multiline
          rows={2}
          name="guest_address"
          onChange={handleChange}
          value={booking.guest_address}
          variant={variant}
        />
      </Grid>
      <Grid item xs={12}>
        <Typography gutterBottom variant="h6">{t("Booking details")}</Typography>
      </Grid>
      {/* Dates and nights */}
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
                autoOk
                variant={variant}
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
                variant={variant}
              />
            </Grid>
          </Grid>
        </MuiPickersUtilsProvider>
      </Grid>
      {/* Price */}
      <Grid
        item container xs={12} alignItems="center"
        justify={!booking.is_flat_rate ? "space-around" : "flex-start"}>
        {!booking.is_flat_rate &&
        <Grid item sm={6} xs={12} className={classes.flexBoxStretched}>
          {t("{{count}} night", { count: booking.duration || 0 })}&nbsp;x&nbsp;
          <TextField
            InputProps={{
              endAdornment: <InputAdornment position="end">€</InputAdornment>
            }}
            label={t("Daily rate")}
            name="daily-rate"
            onChange={handleChange}
            inputRef={register}
            margin="dense"
            required
            value={booking.daily_rate || ""}
            variant={variant}
          />
          <div className={classes.spacer}/>
          =
          <div className={classes.spacer}/>
        </Grid>}
        <Grid item xs={6} className={classes.flexBoxAlignLeft}>
          <TextField
            InputProps={{
              endAdornment: <InputAdornment position="end">€</InputAdornment>
            }}
            label={t("Total")}
            margin="dense"
            name="price"
            onChange={handleChange}
            inputRef={register}
            required
            value={booking.price}
            variant={variant}
          />
          <div className={classes.spacer}/>
          <FormControlLabel
            control={<Checkbox checked={booking.is_flat_rate} color="primary"/>}
            label={t("Flat rate")}
            labelPlacement="start"
            margin="dense"
            name="flat-rate"
            onChange={handleChange}
          />
        </Grid>
      </Grid>
      <Grid item xs={12} className={classes.flexBoxAlignLeft}>
        <TextField
          error={!!errors.deposit}
          InputProps={{
            endAdornment: <InputAdornment position="end">€</InputAdornment>,
            type: "number"
          }}
          inputProps={{ type: "number" }}
          inputRef={register({
            min: 0, max: booking.price
          })}
          label={depositLabel}
          margin="dense"
          multiline
          name="deposit"
          onChange={handleChange}
          value={booking.deposit || ""}
          variant={variant}
        />
        <div className={classes.spacer}/>
        <Typography>
          {booking.price && booking.deposit && t("Balance: {{amount}} €", { amount: booking.price - booking.deposit })}
        </Typography>
      </Grid>
      {/* number of persons */}
      <Grid item xs={12} className={classes.flexBoxAlignLeft}>
        <FormControl variant={variant}>
          <InputLabel htmlFor="booking-status">{t("Adults")}</InputLabel>
          <Select
            inputProps={{
              id: "adults",
              name: "adults"
            }}
            label={t("Adults")}
            margin="dense"
            native
            onChange={handleChange}
            ref={register}
            value={booking.adults}
          >
            {[...Array(10).keys()].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </FormControl>
        <div className={classes.spacer}/>
        <FormControl variant={variant}>
          <InputLabel htmlFor="booking-status">{t("Children")}</InputLabel>
          <Select
            inputProps={{
              id: "children",
              name: "children"
            }}
            label={t("Children")}
            margin="dense"
            native
            onChange={handleChange}
            ref={register}
            value={booking.children}
          >
            {[...Array(10).keys()].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </FormControl>
        <div className={classes.spacer}/>
        <FormControl variant={variant}>
          <InputLabel htmlFor="booking-status">{t("Babies")}</InputLabel>
          <Select
            inputProps={{
              id: "babies",
              name: "babies"
            }}
            label={t("Babies")}
            margin="dense"
            native
            onChange={handleChange}
            ref={register}
            value={booking.babies}
          >
            {[...Array(10).keys()].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {/* options */}
      {/* statistics */}
      <Grid item xs={12}>
        <FormControl className={classes.formControl} variant={variant}>
          <InputLabel htmlFor="booking-source">{t("Statistics")}</InputLabel>
          <Select
            inputProps={{
              id: "booking-source",
              name: "source"
            }}
            label={t("Statistics")}
            margin="dense"
            native
            onChange={handleChange}
            ref={register}
            value={booking.source_id || 0}
          >
            <option key={0} value="">-</option>
            {bookingChannels.map(channel => (
              <option key={channel.id} value={channel.id}>{channel.name}</option>
            ))}
          </Select>
        </FormControl>
      </Grid>
      {/* notes */}
      <Grid item xs={12}>
        <TextField
          fullWidth
          inputRef={register}
          label={t("Further information")}
          margin="dense"
          multiline
          rows={4}
          name="special_conditions"
          onChange={handleChange}
          value={booking.special_conditions || ""}
          variant={variant}
        />
      </Grid>
    </Grid>
  );
};

BookingEdit.propTypes = {
  bookingInstance: bookingType,
  form: PropTypes.shape({
    control: PropTypes.object,
    register: PropTypes.func,
    handleSubmit: PropTypes.func,
    errors: PropTypes.object
  }).isRequired
};

export default BookingEdit;
