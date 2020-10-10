import React, { useEffect } from "react";
import { makeStyles } from "@material-ui/styles";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import { bookingType } from "../../common/propTypesUtils";
import DialogActions from "@material-ui/core/DialogActions";
import Button from "@material-ui/core/Button";
import {
  Contacts as ContactsIcon,
  DeleteForever as DeleteIcon,
  Forward as ForwardIcon,
  PictureAsPdf as PdfIcon,
  Save as SaveIcon
} from "@material-ui/icons";
import * as actions from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import * as selectors from "../../selectors";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { computeBookingPrice, DecimalPrecision } from "../../common/priceUtils";
import { getDepositLabel } from "../../common/ownerPrefsUtils";
import { Grid, TextField } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import FormHelperText from "@material-ui/core/FormHelperText";
import { KeyboardDatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import InputAdornment from "@material-ui/core/InputAdornment";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import useWindowDimensions from "../../common/windowDimensions";
import { useConfirm } from "material-ui-confirm";
import Hidden from "@material-ui/core/Hidden";


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
  },
  deleteButton: {
    color: "red",
    margin: theme.spacing(1)
  },
  priceInput: {
    width: "7em"
  }
}));

const BookingDialog = props => {
  const { className, booking, onClose, onOpenContract } = props;
  const classes = useStyles();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const bookingStatuses = useSelector(store => selectors.bookingStatuses(store));
  const bookingChannels = useSelector(store => selectors.bookingChannels(store));
  const lodgings = useSelector(store => selectors.lodgings(store));
  // const owners = useSelector(store => selectors.owners(store));
  const allGuests = useSelector(store => selectors.guests(store));
  const confirm = useConfirm();
  const variant = "outlined";
  const depositPercent = 30; // TODO load this from owner or lodging prefs

  bookingStatuses.sort((a, b) => a.rank - b.rank);

  // console.debug("booking", booking);
  console.assert(!!booking, "Booking not initialized");

  const objectToValuesArray = object => Object.keys(object).map(function(key) {
    return { [key]: object[key] };
  });

  const initialState = initializeDefaults(booking);

  const form = useForm({
    defaultValues: initialState
  });
  const { register, control, errors, setValue, getValues, watch } = form;

  let lodging = booking ? { ...lodgings.filter(x => x.id === booking.lodging_id)[0] } : undefined;

  // const [booking, setBooking] = useState(initialState);
  const formValues = getValues();
  // const [balance, setBalance] = useState(formValues.price - formValues.deposit);

  const watchBalance = watch(["price", "deposit"], {price: formValues.price, deposit: formValues.deposit});
  const existingGuest = watch("guest_name", initialState.guest_name);
  const isFlatRate = watch("is_flat_rate", initialState.is_flate_rate);
  const duration = watch("duration", initialState.duration);
  const price = watch("price", initialState.price);

  const depositLabel = getDepositLabel(t, lodging && lodging.owner && lodging.owner.deposit_label) || t("Deposit");

  useEffect(() => {
    // dispatch(actions.fetchBookings());
    // dispatch(actions.fetchBookingStatuses());
    // dispatch(actions.fetchBookingChannels());
    // dispatch(actions.fetchLodgings());
    // dispatch(actions.fetchOwners());
  }, [dispatch]);

  function initializeDefaults(booking) {
    if (booking) {
      let initialState = {
        ...booking
        //   status: { ...bookingStatuses.filter(x => x.id === booking.status_id)[0] },
        //   source: { ...bookingChannels.filter(x => x.id === booking.source_id)[0] }
      };

      const lodging = { ...lodgings.filter(x => x.id === booking.lodging_id)[0] };

      // Provide defaults for new bookings
      if (initialState.status_id === undefined) {
        initialState.status_id = bookingStatuses[0].id;
        initialState.status = bookingStatuses[0];
      }
      if (initialState.lodging_id === null)
        initialState.lodging_id = 0;
      initialState.guest_contact = booking.guest_contact || "";
      initialState.guest_address = booking.guest_address || "";
      initialState.begin_date = parseISO(booking.begin_date || format(new Date(), "yyyy-MM-yy"));
      initialState.end_date = parseISO(booking.end_date || format(addDays(initialState.begin_date, initialState.duration || 7), "yyyy-MM-dd"));
      initialState.duration = booking.duration || differenceInCalendarDays(initialState.end_date, initialState.begin_date);
      initialState.daily_rate = booking.daily_rate || lodging.daily_rate;
      initialState.is_flate_rate = booking.is_flate_rate || false;
      if (initialState.price === undefined)
        Object.assign(initialState, computeBookingPrice(initialState.begin_date, initialState.end_date,
          initialState.daily_rate, 0, 0, [], depositPercent));
      initialState.guaranty = booking.guaranty || lodging.guaranty;
      initialState.commission_fees = booking.commission_fees || 0;
      initialState.adults = booking.adults || 2;
      initialState.children = booking.children || 0;
      initialState.babies = booking.babies || 0;
      initialState.source_id = booking.source_id || "";

      // console.debug("initialState", initialState);
      return initialState;
    }
  }

  function handleChange(data) {
    console.debug(data);
    // console.debug("handleChange", data.target);
    let value = data.target.value;
    switch (data.target.name) {
      case "status_id": {
        return data.target.value;
      }
      case "lodging_id": {
        const formValues = getValues();
        value = Number(data.target.value);
        if (value > 0) {
          lodging = lodgings.filter(x => x.id === value)[0];
          if (!isFlatRate && formValues.daily_rate !== lodging.daily_rate) {
            const priceObj = computeBookingPrice(formValues.begin_date, formValues.end_date, lodging.daily_rate, 0, 0, [], depositPercent);
            setValue(objectToValuesArray(priceObj));
          }
        } else
          lodging = null;
        return value;
      }
      case "existing-guest":
        const guest = allGuests.filter(guest => guest.name === data.target.value);
        if (guest) {
          setValue([
            { guest_name: guest[0].name },
            { guest_contact: guest[0].contact },
            { guest_address: guest[0].address }
          ]);
        }
        break;
      case "duration":
        onDurationChange(data.target.value);
        return data.target.value;
      case "daily_rate": {
        value = Number(data.target.value);
        // const formValues = getValues();
        const priceObj = computeBookingPrice(formValues.begin_date, formValues.end_date, value, 0, 0, [], depositPercent);
        setValue(objectToValuesArray(priceObj));
        // setBalance(priceObj.price - priceObj.deposit);
        return value;
      }
      case "price":
        value = Number(data.target.value);
        setValue([
          { daily_rate: DecimalPrecision.round(value / getValues().duration) },
          { price: value },
          { price_details: undefined },
          { is_flat_rate: true }
        ]);
        // setBalance(value - getValues().deposit);
        return value;
      case "is_flat_rate":
        if (data.target.checked)
          return true;
        else {
          const formValues = getValues();
          const priceObj = computeBookingPrice(formValues.begin_date, formValues.end_date, lodging ? lodging.daily_rate : 0, 0, 0, [], depositPercent);
          setValue(objectToValuesArray(priceObj));
          // setBalance(priceObj.price - priceObj.deposit);
          // setValue('is_flat_rate', false);
          return false;
        }
      case "deposit":
        if (!data.target.value) {
          // setBalance(0);
          return 0;
        } else {
          let deposit = Number(data.target.value);
          const price = getValues().price;
          if (deposit && deposit >= 0) {
            if (deposit > price)
              deposit = price;
            // setBalance(price - deposit);
            return deposit;
          }
        }
        break;
      case "adults":
      case "children":
      case "babies":
        // setBooking({ ...booking, [data.target.name]: Number(data.target.value) });
        return Number(data.target.value);
      case "source":
        // value = Number(data.target.value) > 0 ? data.target.value : null;
        // setBooking({ ...booking, [data.target.name]: Number(data.target.value) });
        return data.target.value;
      default:
        console.warn("Unhandled input:", data.target.name);
        return data.target.value;
    }
  }

  function onDurationChange(newValue) {
    const formValues = getValues();
    const duration = Number(newValue);
    const endDate = addDays(formValues.begin_date, duration);
    const priceObj = formValues.is_flat_rate ? { daily_rate: formValues.price / duration }
      : computeBookingPrice(formValues.begin_date, endDate, lodging ? lodging.daily_rate : 0, 0, 0, [], depositPercent);
    setValue(objectToValuesArray(priceObj));
    setValue([{ end_date: endDate }]);
    return duration;
  }

  function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
  }

  function onDateChange(newDate, fieldName) {
    const formValues = getValues();
    if (!isValidDate(newDate))
      return newDate;
    const newBooking = {
      ...formValues,
      // [fieldName]: format(newDate, "yyyy-MM-dd")
      [fieldName]: newDate
    };
    const duration = differenceInCalendarDays(newBooking.end_date, newBooking.begin_date);
    const priceObj = newBooking.is_flat_rate ? { daily_rate: newBooking.price / duration }
      : computeBookingPrice(newBooking.begin_date, newBooking.end_date, lodging ? lodging.daily_rate : 0, 0, 0, [], depositPercent);
    setValue([
      ...objectToValuesArray(priceObj),
      { duration: duration }
    ]);
    return newBooking[fieldName];
  }

  function handleBeginDateChange(newDate) {
    return onDateChange(newDate, "begin_date");
  }

  function handleEndDateChange(newDate) {
    return onDateChange(newDate, "end_date");
  }

  function openContract() {
    onOpenContract(booking);
  }

  function onCancel() {
    onClose();
  }

  function onDelete() {
    confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {
        guest_name: booking.guest_name,
        lodging_name: booking.lodging.name
      }),
      description: t("Do you really want to permanently delete this booking?")
    })
      .then(() => {
        dispatch(actions.deleteBooking(booking.id, () => {
          onClose();
        }));
      })
      .catch(() => { /* ... */
      });
  }

  function onSubmit(data) {
    console.log("Submit: ", data);
    const submittedBooking = {
      ...data,
      begin_date: data.begin_date.toISOString().substr(0, 10),
      end_date: data.end_date.toISOString().substr(0, 10),
      lodging_id: data.lodging_id > 0 ? data.lodging_id : null
    };
    const action = booking.id ? actions.updateBooking : actions.createBooking;
    dispatch(action(submittedBooking, () => {
      console.debug("Closing...");
      onClose(submittedBooking);
    }));
  }

  return (
    <Dialog
      className={clsx(classes.root, className)}
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={!!booking}
      maxWidth="sm"
      fullScreen={width <= 600}
    >
      <DialogTitle id="simple-dialog-title">
        {booking && booking.id ? t("Modify a booking") : t("Add a booking")}
      </DialogTitle>
      <DialogContent>
        {/*<DialogContentText>*/}
        {/*  {booking && booking.id ?*/}
        {/*    t("You can change booking details") : t("You can create a new booking") }*/}
        {/*</DialogContentText>*/}
        {booking &&
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Grid
            container
            spacing={1}
          >
            <input
              type="hidden"
              name="id"
              ref={register}
              defaultValue={booking.id}
            />
            <input
              type="hidden"
              name="guaranty"
              ref={register}
              defaultValue={initialState.guaranty}
            />
            <Grid item sm={4} xs={12}>
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="status_id">{t("Booking status")}</InputLabel>
                <Controller
                  as={Select}
                  name="status_id"
                  control={control}
                  label={t("Booking status")}
                  margin="dense"
                  onChange={([event]) => event.target.value}
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
                <Controller
                  as={Select}
                  name="lodging_id"
                  control={control}
                  rules={{ required: true }}
                  label={t("Lodging")}
                  margin="dense"
                  onChange={([event]) => handleChange(event)}
                >
                  {lodgings.map(lodging => (
                    <MenuItem key={lodging.id} value={lodging.id}>{lodging.name}</MenuItem>
                  ))}
                  <MenuItem value="" disabled>---</MenuItem>
                  <MenuItem value="0">{t("Cancellation / Waiting")}</MenuItem>
                </Controller>
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
                    id: "booking-existing-guest"
                  }}
                  label={t("Existing guest")}
                  margin="dense"
                  name="existing-guest"
                  native
                  onChange={handleChange}
                  value={existingGuest}
                  ref={register}
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
              <Controller
                as={TextField}
                name="guest_name"
                control={control}
                rules={{ required: true }}
                fullWidth
                error={!!errors.guest_name}
                helperText={errors.guest_name && t("Guest name is required")}
                label={t("Full guest name")}
                margin="dense"
                required
                variant={variant}
              />
            </Grid>
            <Grid item sm={6} xs={12}>
              <Controller
                as={TextField}
                name="guest_contact"
                control={control}
                fullWidth
                label={t("Phone / email")}
                margin="dense"
                multiline
                rows={2}
                variant={variant}
              />
            </Grid>
            <Grid item sm={6} xs={12}>
              <Controller
                as={TextField}
                control={control}
                name="guest_address"
                fullWidth
                label={t("Address")}
                margin="dense"
                multiline
                rows={2}
                variant={variant}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography gutterBottom variant="h6">{t("Booking details")}</Typography>
            </Grid>
            {/* Dates and nights */}
            <Grid item xs={12}>
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="duration">{t("Nights")}</InputLabel>
                <Controller
                  as={Select}
                  name="duration"
                  control={control}
                  label={t("Nights")}
                  margin="dense"
                  onChange={([event]) => handleChange(event)}
                >
                  {Array.from({ length: 31 }, (v, k) => k + 1).map(n => (
                    <MenuItem key={n} value={n}>{n}</MenuItem>
                  ))}
                  {(duration > 31) &&
                  <MenuItem key={duration} value={duration}>{duration}</MenuItem>
                  }
                </Controller>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <MuiPickersUtilsProvider utils={DateFnsUtils}>
                <Grid container justify="space-around" alignItems="center">
                  <Grid item sm={5} xs={12}>
                    <Controller
                      as={KeyboardDatePicker}
                      control={control}
                      format="dd/MM/yyyy"
                      id="date-picker-inline"
                      KeyboardButtonProps={{
                        "aria-label": "arrival date"
                      }}
                      label={t("Arrival")}
                      margin="dense"
                      name="begin_date"
                      onChange={([date]) => handleBeginDateChange(date)}
                      variant={variant}
                      inputVariant={variant}
                      autoOk
                    />
                  </Grid>
                  <Hidden xsDown>
                    <Grid item sm={2} xs={12} style={{ "textAlign": "center" }}>
                      <ForwardIcon/>
                    </Grid>
                  </Hidden>
                  <Grid item sm={5} xs={12}>
                    <Controller
                      as={KeyboardDatePicker}
                      control={control}
                      format="dd/MM/yyyy"
                      id="date-picker-dialog"
                      KeyboardButtonProps={{
                        "aria-label": "departure date"
                      }}
                      label={t("Departure")}
                      margin="dense"
                      name="end_date"
                      onChange={([date]) => handleEndDateChange(date)}
                      variant={variant}
                      inputVariant={variant}
                      autoOk
                    />
                  </Grid>
                </Grid>
              </MuiPickersUtilsProvider>
            </Grid>
            {/* Price */}
            <Grid item container xs={12} alignItems="center" justify={!isFlatRate ? "space-around" : "flex-start"}>
              {!isFlatRate &&
              <Grid item sm={7} xs={12} className={classes.flexBoxStretched}>
                <span>{t("{{count}} night", { count: duration })}&nbsp;x&nbsp;</span>
                <TextField
                  className={classes.priceInput}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">€</InputAdornment>,
                    type: "number"
                  }}
                  label={t("Daily rate")}
                  name="daily_rate"
                  error={!!errors.daily_rate}
                  onChange={handleChange}
                  inputRef={register({ min: 1 })}
                  margin="dense"
                  required
                  variant={variant}
                />
                <div className={classes.spacer}/>
                =
                <div className={classes.spacer}/>
              </Grid>}
              <Grid item sm={5} xs={12} className={classes.flexBoxAlignLeft}>
                <TextField
                  className={classes.priceInput}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">€</InputAdornment>,
                    type: "number"
                  }}
                  label={t("Total")}
                  margin="dense"
                  name="price"
                  onChange={handleChange}
                  inputRef={register}
                  required
                  variant={variant}
                />
                <div className={classes.spacer}/>
                <FormControlLabel
                  control={
                    <Controller
                      as={Checkbox}
                      control={control}
                      color="primary"
                      name="is_flat_rate"
                      defaultValue={initialState.is_flate_rate}
                      onChange={([event]) => handleChange(event)}
                    />
                  }
                  label={t("Flat rate")}
                  labelPlacement="start"
                  margin="dense"
                />
              </Grid>
            </Grid>
            <Grid item xs={12} className={classes.flexBoxAlignLeft}>
              <TextField
                error={!!errors.deposit}
                helperText={errors.deposit && errors.deposit.message}
                className={classes.priceInput}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  type: "number"
                }}
                inputRef={register({
                  min: { value: 0, message: t("{{depositLabel}} can't be negative", { depositLabel: depositLabel }) },
                  max: {
                    value: price,
                    message: t("{{depositLabel}} can't be higher than price", { depositLabel: depositLabel })
                  }
                })}
                label={depositLabel}
                margin="dense"
                name="deposit"
                onChange={handleChange}
                variant={variant}
              />
              <div className={classes.spacer}/>
              <Typography>
                {watchBalance && t("Balance: {{amount}} €", { amount: watchBalance.price - watchBalance.deposit })}
              </Typography>
            </Grid>
            <Grid item xs={12} className={classes.flexBoxAlignLeft}>
              <TextField
                error={!!errors.commission_fees}
                helperText={errors.commission_fees && errors.commission_fees.message}
                className={classes.priceInput}
                InputProps={{
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                  type: "number"
                }}
                inputRef={register({
                  min: { value: 0, message: t("Commission fees can't be negative") }
                })}
                label={t("Commission fees")}
                margin="dense"
                name="commission_fees"
                onChange={handleChange}
                variant={variant}
              />
            </Grid>
            {/* number of persons */}
            <Grid item xs={12} className={classes.flexBoxAlignLeft}>
              <FormControl variant={variant}>
                <InputLabel htmlFor="adults">{t("Adults")}</InputLabel>
                <Controller
                  as={Select}
                  name="adults"
                  control={control}
                  label={t("Adults")}
                  margin="dense"
                  native
                  onChange={([event]) => handleChange(event)}
                >
                  {[...Array(10).keys()].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Controller>
              </FormControl>
              <div className={classes.spacer}/>
              <FormControl variant={variant}>
                <InputLabel htmlFor="children">{t("Children")}</InputLabel>
                <Controller
                  as={Select}
                  name="children"
                  control={control}
                  label={t("Children")}
                  margin="dense"
                  native
                  onChange={([event]) => handleChange(event)}
                >
                  {[...Array(10).keys()].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Controller>
              </FormControl>
              <div className={classes.spacer}/>
              <FormControl variant={variant}>
                <InputLabel htmlFor="babies">{t("Babies")}</InputLabel>
                <Controller
                  as={Select}
                  name="babies"
                  control={control}
                  label={t("Babies")}
                  margin="dense"
                  native
                  onChange={([event]) => handleChange(event)}
                >
                  {[...Array(10).keys()].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </Controller>
              </FormControl>
            </Grid>
            {/* options */}
            {/* statistics */}
            <Grid item xs={12}>
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="booking-source">{t("Statistics")}</InputLabel>
                <Controller
                  as={Select}
                  name="source_id"
                  control={control}
                  label={t("Statistics")}
                  margin="dense"
                  // native
                  onChange={([event]) => handleChange(event)}
                >
                  <MenuItem key={0} value=""/>
                  {bookingChannels.map(channel => (
                    <MenuItem key={channel.id} value={channel.id}>{channel.name}</MenuItem>
                  ))}
                </Controller>
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
                variant={variant}
              />
            </Grid>
          </Grid>
        </form>
        }
      </DialogContent>
      <DialogActions>
        <Grid container justify="space-between">
          <Grid item>
            {booking && booking.id &&
            <Button
              type="button"
              className={classes.deleteButton}
              color="secondary"
              startIcon={<DeleteIcon/>}
              onClick={onDelete}
            >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            {onOpenContract &&
            <Button
              type="button"
              color="default"
              className={classes.button}
              startIcon={<PdfIcon/>}
              onClick={openContract}
            >{t("Contract")}</Button>}
          </Grid>
          <Grid item>
            <Button type="button" color="default" onClick={onCancel}>{t("Cancel")}</Button>
            <Button
              type="submit"
              color="primary"
              className={classes.button}
              startIcon={<SaveIcon/>}
              onClick={form.handleSubmit(onSubmit)}
            >{t("Save")}</Button>
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

BookingDialog.propTypes = {
  booking: bookingType,
  className: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onOpenContract: PropTypes.func
};

export default BookingDialog;
