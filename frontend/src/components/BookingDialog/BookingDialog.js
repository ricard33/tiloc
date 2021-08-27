import React, { useEffect, useState } from "react";
import { makeStyles, withStyles } from "@material-ui/styles";
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
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon
} from "@material-ui/icons";
import * as actions from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import { Controller, useForm, useFieldArray } from "react-hook-form";
import * as selectors from "../../selectors";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { computeBookingPrice, computeOptionsPrice, DecimalPrecision } from "../../common/priceUtils";
import { getDepositLabel } from "../../common/ownerPrefsUtils";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary as MuiAccordionSummary,
  Grid,
  TextField
} from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";
import FormHelperText from "@material-ui/core/FormHelperText";
import { KeyboardDatePicker } from "@material-ui/pickers";
import InputAdornment from "@material-ui/core/InputAdornment";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import useWindowDimensions from "../../common/windowDimensions";
import { useConfirm } from "material-ui-confirm";
import Hidden from "@material-ui/core/Hidden";
import { formatISO } from "../../common/tzUtils";
import Payments from "../Payments";
import { formatCurrency } from "../../common/intlUtils";


const AccordionSummary = withStyles({
  root: {
    backgroundColor: "rgba(0, 0, 0, .03)",
    borderBottom: "1px solid rgba(0, 0, 0, .125)",
    marginBottom: -1,
    minHeight: 56,
    "&$expanded": {
      minHeight: 38
    }
  },
  content: {
    "&$expanded": {
      margin: "3px 0"
    },
    "& p": {
      marginBottom: 0
    }
  },
  expanded: {}
})(MuiAccordionSummary);

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(1)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    fontWeight: theme.typography.fontWeightBold,
    flexShrink: 0,
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
    position: 'absolute',
    right: '60px',
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
  },
  quantityInput: {
    fontSize: "medium",
    width: "5em"
  },
  options: {
    alignItems: "center",
    fontSize: "small",
    textAlign: "center"
  },
  totalWrapper: {
    textAlign: 'right',
  },
  totalPrice: {},
  thirdPartyPrice: {
    fontSize: "x-small"
  },
  leftToPay: {
    // color: 'orange',
  },
  tooPerceived: {
    color: 'orange',
  },
  fullyPaid: {
    color: 'dark green'
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
  const allOptions = useSelector(store => selectors.services(store));
  // const [selectedOptions, setSelectedOptions] = useState(booking.options || [])
  const [totalPayment, setTotalPayment] = useState(Number(booking.total_payments));
  const confirm = useConfirm();
  const variant = "filled";
  const depositPercent = 30; // TODO load this from owner or lodging prefs

  bookingStatuses.sort((a, b) => a.rank - b.rank);

  // console.debug("booking", booking);
  console.assert(!!booking, "Booking not initialized");

  const setMultipleValues = object => Object.keys(object).forEach(function(key) {
    setValue(key, object[key]);
  });

  const initialState = initializeDefaults(booking);

  const form = useForm({
    defaultValues: initialState
  });
  const { register, control, setValue, getValues, watch, formState } = form;
  const { errors, dirty, /*isValid*/ } = formState;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "options"
  });
  let lodging = booking ? { ...lodgings.filter(x => x.id === booking.lodging_id)[0] } : undefined;

  const formValues = getValues();
  // console.debug("formValues: ", formValues);

  const deposit = watch("deposit", initialState.deposit);
  const existingGuest = watch("guest_name", initialState.guest_name);
  const isFlatRate = watch("is_flat_rate", initialState.is_flat_rate);
  const duration = watch("duration", initialState.duration);
  const price = watch("price", initialState.price);
  const options = watch("options", fields);
  const [includedInPriceOptions, excludedFromPriceOptions] = computeOptionsPrice(options, duration);
  // const fullPrice = watch("fullPrice", Number(price) + includedInPriceOptions);
  const fullPrice = Number(price) + includedInPriceOptions;
  const leftToPay = fullPrice - totalPayment;
  // console.log("options", options, fullPrice);

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
      initialState.is_flat_rate = booking.is_flat_rate || false;
      if (initialState.price === undefined)
        Object.assign(initialState, computeBookingPrice(initialState.begin_date, initialState.end_date,
          initialState.daily_rate, 0, 0, [], depositPercent));
      initialState.guaranty = booking.guaranty || lodging.guaranty;
      initialState.commission_fees = booking.commission_fees || 0;
      initialState.adults = booking.adults || 2;
      initialState.children = booking.children || 0;
      initialState.babies = booking.babies || 0;
      initialState.source_id = booking.source_id || "";
      initialState.options = booking.options || [];

      // console.debug("initialState", initialState);
      return initialState;
    }
  }

  function onAddOption(data) {
    console.debug("ADD OPTION", data.target.value);
    const value = Number(data.target.value);
    const option = allOptions.filter(o => o.id === value)[0];
    append(option);
  }

  function handleChange(data) {
    // console.debug(data);
    // console.debug("handleChange", data.target.value);
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
            setMultipleValues(priceObj);
          }
        } else
          lodging = null;
        return value;
      }
      case "existing-guest":
        const guest = allGuests.filter(guest => guest.name === data.target.value);
        if (guest) {
          setValue("guest_name", guest[0].name);
          setValue("guest_contact", guest[0].contact);
          setValue("guest_address", guest[0].address);
        }
        break;
      case "duration":
        onDurationChange(data.target.value);
        return data.target.value;
      case "daily_rate": {
        value = Number(data.target.value);
        // const formValues = getValues();
        const priceObj = computeBookingPrice(formValues.begin_date, formValues.end_date, value, 0, 0, [], depositPercent);
        setMultipleValues(priceObj);
        // setBalance(priceObj.price - priceObj.deposit);
        return value;
      }
      case "price":
        value = Number(data.target.value);
        setValue("daily_rate", DecimalPrecision.round(value / getValues().duration));
        setValue("price", value);
        setValue("price_details", undefined);
        setValue("is_flat_rate", true);
        // setBalance(value - getValues().deposit);
        return value;
      case "is_flat_rate":
        if (data.target.checked)
          return true;
        else {
          const formValues = getValues();
          const priceObj = computeBookingPrice(formValues.begin_date, formValues.end_date, lodging ? lodging.daily_rate : 0, 0, 0, [], depositPercent);
          setMultipleValues(priceObj);
          // setBalance(priceObj.price - priceObj.deposit);
          // setValue('is_flat_rate', false);
          return false;
        }
      case "deposit":
        if (!data.target.value) {
          // setBalance(0);
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
        return 0;
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
    setMultipleValues(priceObj);
    setValue("end_date", endDate);
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
    setMultipleValues(priceObj);
    setValue("duration", duration);
    return newBooking[fieldName];
  }

  function handleBeginDateChange(newDate, onChange) {
    onChange(newDate);
    return onDateChange(newDate, "begin_date");
  }

  function handleEndDateChange(newDate, onChange) {
    onChange(newDate);
    return onDateChange(newDate, "end_date");
  }

  function openContract(data) {
    if (dirty) {
      confirm({
        title: t("Unsaved changes detected"),
        description: t("Some modifications aren't saved. Do you want to save them and open contract?")
      })
        .then(() => {
          saveBooking(data, submittedBooking => onOpenContract(submittedBooking));
        });
    } else
      onOpenContract(booking);
  }

  function onCancel() {
    onClose();
  }

  function onDelete() {
    confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {
        guest_name: booking.guest_name,
        lodging_name: booking.lodging ? booking.lodging.name : "-"
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

  function saveBooking(data, callback) {
    console.log("Submit: ", data);
    const submittedBooking = {
      ...data,
      begin_date: formatISO(data.begin_date),
      end_date: formatISO(data.end_date),
      lodging_id: data.lodging_id > 0 ? data.lodging_id : null
    };
    const action = booking.id ? actions.updateBooking : actions.createBooking;
    dispatch(action(submittedBooking, () => {
      if (callback)
        callback(submittedBooking);
    }));

  }

  function onSubmit(data) {
    saveBooking(data, submittedBooking => {
      console.debug("Closing...");
      onClose(submittedBooking);
    });
  }

  function getDesignation(option) {
    return option.designation + (
      option.unit_price ? " - " + option.unit_price + "€" + (
        !option.is_flat_rate ? " / j" : ""
      ) : ""
    );
  }

  return (
    <Dialog
      className={clsx(classes.root, className)}
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={!!booking}
      maxWidth={width < 1280 ? "sm" : "lg"}
      fullScreen={width < 600}
    >
      <DialogTitle id="simple-dialog-title">
        <Grid justifyContent="space-between" container spacing={4}>
          <Grid item xs={6}>
            {booking && booking.id ? t("Modify a booking") : t("Add a booking")}
          </Grid>
          <Grid item xs={6} className={classes.totalWrapper}>
            <span className={classes.totalPrice}>
              {t("total = {{ fullPrice }}", { fullPrice: formatCurrency(fullPrice) })}</span>
            {(excludedFromPriceOptions) > 0 && (
              <span
                className={classes.thirdPartyPrice}
              ><br />(+ {formatCurrency(excludedFromPriceOptions)} {t("for third party services")})</span>)
            }
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent dividers>
        {booking &&
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <input
            type="hidden"
            {...register("id")}
            defaultValue={booking.id}
          />
          <input
            type="hidden"
            {...register("guaranty")}
            defaultValue={initialState.guaranty}
          />
          <Grid container spacing={1}>
            { /* BOOKING STATUS */ }
            <Grid item sm={4} xs={12}>
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel id="status-label">{t("Booking status")}</InputLabel>
                <Controller
                  name="status_id"
                  control={control}
                  render={({ field }) =>
                    <Select
                      labelId="status-label"
                      margin="dense"
                      {...field}
                    >
                      {bookingStatuses.map(status => (
                        <MenuItem key={status.id} value={status.id}>
                          <span
                            className={classes.statusItem}
                            style={{ background: "#" + status.color }}
                          >{status.name}</span>
                        </MenuItem>
                      ))}
                    </Select>}
                />
              </FormControl>
            </Grid>
            { /* LODGING */ }
            <Grid item sm={8} xs={12}>
              <FormControl className={classes.formControl} variant={variant}>
                <InputLabel htmlFor="booking-lodging">{t("Lodging")}</InputLabel>
                <Controller
                  name="lodging_id"
                  control={control}
                  rules={{ required: true }}
                  render={({field}) =>
                    <Select
                      label={t("Lodging")}
                      margin="dense"
                      {...field}
                      onChange={(event) => field.onChange(handleChange(event))}
                    >
                      {lodgings.map(lodging => (
                        <MenuItem key={lodging.id} value={lodging.id}>{lodging.name}</MenuItem>
                      ))}
                      <MenuItem value="" disabled>---</MenuItem>
                      <MenuItem value="0">{t("Cancellation / Waiting")}</MenuItem>
                    </Select>}
                />
              </FormControl>
            </Grid>
            { /* GUEST */ }
            <Grid item lg={6} xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="guest-header">
                  <Typography gutterBottom className={classes.heading}>{t("Guest")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    <Grid item xs={1}>
                      <ContactsIcon />
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
                          native
                          value={existingGuest}
                          onChange={handleChange}
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
                        name="guest_name"
                        control={control}
                        rules={{ required: true }}
                        render={({field}) =>
                          <TextField
                            fullWidth
                            error={!!errors.guest_name}
                            helperText={errors.guest_name && t("Guest name is required")}
                            label={t("Full guest name")}
                            margin="dense"
                            required
                            variant={variant}
                            {...field}
                          />}
                      />
                    </Grid>
                    <Grid item sm={6} xs={12}>
                      <Controller
                        name="guest_contact"
                        control={control}
                        render={({field}) =>
                          <TextField
                            fullWidth
                            label={t("Phone / email")}
                            margin="dense"
                            multiline
                            rows={2}
                            variant={variant}
                            {...field}
                          />}
                      />
                    </Grid>
                    <Grid item sm={6} xs={12}>
                      <Controller
                        control={control}
                        name="guest_address"
                        render={({field}) =>
                          <TextField
                            fullWidth
                            label={t("Address")}
                            margin="dense"
                            multiline
                            rows={2}
                            variant={variant}
                            {...field}
                          />}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            { /* BOOKING DETAILS */ }
            <Grid item lg={6} xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="booking-header">
                  <Typography gutterBottom className={classes.heading}>{t("Booking details")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {/* Dates and nights */}
                    <Grid item xs={12}>
                      <FormControl className={classes.formControl} variant={variant}>
                        <InputLabel htmlFor="duration">{t("Nights")}</InputLabel>
                        <Controller
                          name="duration"
                          control={control}
                          rules={{ valueAsNumber: true }}
                          render={({field}) =>
                            <Select
                              label={t("Nights")}
                              margin="dense"
                              {...field}
                              onChange={(event) => field.onChange(handleChange(event))}
                            >
                              {Array.from({ length: 31 }, (v, k) => k + 1).map(n => (
                                <MenuItem key={n} value={n}>{n}</MenuItem>
                              ))}
                              {(duration > 31) &&
                              <MenuItem key={duration} value={duration}>{duration}</MenuItem>
                              }
                            </Select>}
                        />
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container justifyContent="space-around" alignItems="center">
                        <Grid item sm={5} xs={12}>
                          <Controller
                            control={control}
                            name="begin_date"
                            render={({ field }) =>
                              <KeyboardDatePicker
                                format="dd/MM/yyyy"
                                id="date-picker-start"
                                KeyboardButtonProps={{
                                  "aria-label": "arrival date"
                                }}
                                label={t("Arrival")}
                                margin="dense"
                                selected={field.value}
                                variant="inline"
                                inputVariant={variant}
                                autoOk
                                {...field}
                                onChange={(date) => handleBeginDateChange(date, field.onChange)}
                              />}
                          />
                        </Grid>
                        <Hidden xsDown>
                          <Grid item sm={2} xs={12} style={{ "textAlign": "center" }}>
                            <ForwardIcon />
                          </Grid>
                        </Hidden>
                        <Grid item sm={5} xs={12}>
                          <Controller
                            control={control}
                            name="end_date"
                            render={({ field }) =>
                              <KeyboardDatePicker
                                format="dd/MM/yyyy"
                                id="date-picker-stop"
                                KeyboardButtonProps={{
                                  "aria-label": "departure date"
                                }}
                                label={t("Departure")}
                                margin="dense"
                                variant="inline"
                                inputVariant={variant}
                                autoOk
                                {...field}
                                onChange={(date) => handleEndDateChange(date, field.onChange)}
                              />}
                          />
                        </Grid>
                      </Grid>
                    </Grid>
                    {/* Price */}
                    <Grid
                      item container xs={12}
                      alignItems="center"
                      justifyContent={!isFlatRate ? "space-around" : "flex-start"}
                    >
                      {!isFlatRate &&
                      <Grid item sm={7} xs={12} className={classes.flexBoxStretched}>
                        <span>{t("{{count}} night", { count: duration })}&nbsp;x&nbsp;</span>
                        <Controller
                          name="daily_rate"
                          control={control}
                          rules={{ min: 1, valueAsNumber: true }}
                          render={({ field }) =>
                            <TextField
                              className={classes.priceInput}
                              label={t("Daily rate")}
                              error={!!errors.daily_rate}
                              margin="dense"
                              variant={variant}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>,
                                type: "number"
                              }}
                              {...field}
                              onChange={event => field.onChange(handleChange(event))}
                            />}
                          required
                        />
                        <div className={classes.spacer} />
                        =
                        <div className={classes.spacer} />
                      </Grid>}
                      <Grid item sm={5} xs={12} className={classes.flexBoxAlignLeft}>
                        <Controller
                          control={control}
                          name="price"
                          rules={{ valueAsNumber: true }}
                          render={({ field }) =>
                            <TextField
                              className={classes.priceInput}
                              InputProps={{
                                endAdornment: <InputAdornment position="end">€</InputAdornment>,
                                type: "number"
                              }}
                              label={t("Total")}
                              margin="dense"
                              required
                              variant={variant}
                              {...field}
                              onChange={event => field.onChange(handleChange(event))}
                            />}
                        />
                        <div className={classes.spacer} />
                        <FormControlLabel
                          control={
                            <Controller
                              control={control}
                              name="is_flat_rate"
                              render={({ field }) =>
                                <Checkbox
                                  color="primary"
                                  defaultValue={initialState.is_flat_rate}
                                  {...field}
                                  checked={field.value}
                                  onChange={event => field.onChange(handleChange(event))}
                                />}
                            />
                          }
                          label={t("Flat rate")}
                          labelPlacement="start"
                          margin="dense"
                        />
                      </Grid>
                    </Grid>
                    {/* Deposit */}
                    <Grid item xs={12} className={classes.flexBoxAlignLeft}>
                      <Controller
                        control={control}
                        name="deposit"
                        rules={{
                          min: {
                            value: 0,
                            message: t("{{depositLabel}} can't be negative", { depositLabel: depositLabel })
                          },
                          max: {
                            value: price,
                            message: t("{{depositLabel}} can't be higher than price", { depositLabel: depositLabel })
                          },
                          valueAsNumber: true,
                        }}
                        render={({ field }) =>
                          <TextField
                            error={!!errors.deposit}
                            helperText={errors.deposit && errors.deposit.message}
                            className={classes.priceInput}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">€</InputAdornment>,
                              type: "number"
                            }}
                            label={depositLabel}
                            margin="dense"
                            variant={variant}
                            {...field}
                            onChange={event => field.onChange(handleChange(event))}
                          />}
                      />
                      <div className={classes.spacer} />
                      <Typography>
                        {price ? t("Balance: {{amount}}", { amount: formatCurrency(price - deposit) }) : ""}
                      </Typography>
                    </Grid>
                    { /* commission fees */ }
                    <Grid item xs={12} className={classes.flexBoxAlignLeft}>
                      <Controller
                        control={control}
                        name="commission_fees"
                        rules={{
                          min: { value: 0, message: t("Commission fees can't be negative") },
                          valueAsNumber: true,
                        }}
                        render={({ field }) =>
                          <TextField
                            error={!!errors.commission_fees}
                            helperText={errors.commission_fees && errors.commission_fees.message}
                            className={classes.priceInput}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">€</InputAdornment>,
                              type: "number"
                            }}
                            label={t("Commission fees")}
                            margin="dense"
                            variant={variant}
                            {...field}
                            onChange={event => field.onChange(handleChange(event))}
                          />}
                      />
                    </Grid>
                    {/* number of persons */}
                    <Grid item xs={12} className={classes.flexBoxAlignLeft}>
                      <FormControl variant={variant}>
                        <InputLabel htmlFor="adults">{t("Adults")}</InputLabel>
                        <Controller
                          name="adults"
                          control={control}
                          rules={{ valueAsNumber: true }}
                          render={({ field }) =>
                            <Select
                              label={t("Adults")}
                              margin="dense"
                              native
                              {...field}
                              onChange={event => field.onChange(handleChange(event))}
                            >
                              {[...Array(10).keys()].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </Select>}
                        />
                      </FormControl>
                      <div className={classes.spacer} />
                      <FormControl variant={variant}>
                        <InputLabel htmlFor="children">{t("Children")}</InputLabel>
                        <Controller
                          name="children"
                          control={control}
                          rules={{ valueAsNumber: true }}
                          render={({ field }) =>
                            <Select
                              label={t("Children")}
                              margin="dense"
                              native
                              {...field}
                              onChange={event => field.onChange(handleChange(event))}
                            >
                              {[...Array(10).keys()].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </Select>}
                        />
                      </FormControl>
                      <div className={classes.spacer} />
                      <FormControl variant={variant}>
                        <InputLabel htmlFor="babies">{t("Babies")}</InputLabel>
                        <Controller
                          name="babies"
                          control={control}
                          rules={{ valueAsNumber: true }}
                          render={({ field }) =>
                            <Select
                              label={t("Babies")}
                              margin="dense"
                              native
                              {...field}
                              onChange={event => field.onChange(handleChange(event))}
                            >
                              {[...Array(10).keys()].map(n => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </Select>}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            { /* OPTIONS */ }
            <Grid item lg={6} xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="options-content" id="options-header">
                  <Typography gutterBottom className={classes.heading}>{t("Options")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      {
                        fields.map((option, index) => (
                          <Grid container key={option.id} className={classes.options}>
                            <input
                              type="hidden" {...register(`options[${index}].id`)}
                              defaultValue={option.id}
                            />
                            <input
                              type="hidden" {...register(`options[${index}].designation`)}
                              defaultValue={option.designation}
                            />
                            <input
                              type="hidden" {...register(`options[${index}].unit_price`)}
                              defaultValue={option.unit_price}
                            />
                            <input
                              type="hidden" {...register(`options[${index}].vat`)}
                              defaultValue={option.vat}
                            />
                            <input
                              type="hidden" {...register(`options[${index}].is_flat_rate`)}
                              defaultValue={option.is_flat_rate}
                            />
                            <input
                              type="hidden" {...register(`options[${index}].not_included_in_price`)}
                              defaultValue={option.not_included_in_price}
                            />
                            <Grid item xs={6} style={{ textAlign: "left" }}><span>{getDesignation(option)}</span></Grid>
                            <Grid item xs={1} style={{ textAlign: "right" }}>{option.unit_price &&
                            <span>{option.unit_price}&nbsp;x</span>}</Grid>
                            <Grid item xs={2}>
                              <Controller
                                control={control}
                                name={"options[" + index + "].quantity"}
                                rules={{ valueAsNumber: true }}
                                render={({field}) =>
                                  <TextField
                                    InputProps={{
                                      type: "number"
                                    }}
                                    className={classes.quantityInput}
                                    margin="dense"
                                    defaultValue={option.quantity}
                                    required
                                    // variant={variant}
                                    {...field}
                                  />}
                              />
                            </Grid>
                            <Grid item xs={2} style={{ textAlign: "left" }}>
                              {option.unit_price &&
                              <span>=&nbsp;{formatCurrency(option.unit_price * (options[index] ? options[index].quantity : option.quantity) * (option.is_flat_rate ? 1 : duration))}</span>}
                            </Grid>
                            <Grid item xs={1}>
                              <Button
                                type="button"
                                className={classes.deleteButton}
                                color="secondary"
                                startIcon={<DeleteIcon />}
                                onClick={() => remove(index)}
                              />
                            </Grid>
                          </Grid>
                        ))
                      }
                      <FormControl className={classes.formControl} variant={variant}>
                        <InputLabel htmlFor="booking-options">{t("Options")}</InputLabel>
                        <Select
                          inputProps={{
                            name: "options_select",
                            id: "booking-options"
                          }}
                          label={t("Options")}
                          margin="dense"
                          native
                          value={0}
                          onChange={onAddOption}
                        >
                          <option key={0} value={0}>{t("-- Add an option --")}</option>
                          {allOptions.map(option => (
                            <option
                              key={option.id} value={option.id}
                              disabled={fields.filter(o => Number(o.id) === option.id).length > 0}
                            >
                              {getDesignation(option)}
                            </option>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            { /* COMPLEMENTS */ }
            <Grid item lg={6} xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />} aria-controls="complements-content"
                  id="complements-header"
                >
                  <Typography gutterBottom className={classes.heading}>{t("Complements")}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={1}>
                    {/* statistics */}
                    <Grid item xs={12}>
                      <FormControl className={classes.formControl} variant={variant}>
                        <InputLabel htmlFor="booking-source">{t("Statistics")}</InputLabel>
                        <Controller
                          name="source_id"
                          control={control}
                          render={({field}) =>
                            <Select
                              label={t("Statistics")}
                              margin="dense"
                              // native
                              {...field}
                              onChange={event => field.onChange(handleChange(event))}
                            >
                              <MenuItem key={0} value="" />
                              {bookingChannels.map(channel => (
                                <MenuItem key={channel.id} value={channel.id}>{channel.name}</MenuItem>
                              ))}
                            </Select>}
                        />
                      </FormControl>
                    </Grid>
                    {/* notes */}
                    <Grid item xs={12}>
                      <Controller
                        control={control}
                        name="special_conditions"
                        render={({ field }) =>
                          <TextField
                            fullWidth
                            inputRef={register("special_conditions")}
                            label={t("Further information")}
                            margin="dense"
                            multiline
                            rows={4}
                            variant={variant}
                            {...field}
                          />}
                      />
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
            { /* PAYMENTS */ }
            {booking.id &&
            <Grid item lg={6} xs={12}>
              <Accordion defaultExpanded>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />} aria-controls="complements-content"
                  id="complements-header"
                >
                  <Typography gutterBottom className={classes.heading}>{t("Payments")}</Typography>
                  <Typography gutterBottom className={classes.secondaryHeading}>
                    {leftToPay > 0 && <span className={classes.leftToPay}>{t("Left to pay: {{amount}}", {amount: formatCurrency(leftToPay)})}</span>}
                    {leftToPay < 0 && <span className={classes.tooPerceived}>{t("Too perceived: {{amount}}", {amount: formatCurrency(-leftToPay)})}</span>}
                    {leftToPay === 0 && t("Fully paid")}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Payments
                    bookingId={booking.id} onPaymentsUpdate={(total) => {
                      booking.total_payments = total;
                      booking.left_to_pay = fullPrice - total;
                      setTotalPayment(total);
                    }}
                  />
                </AccordionDetails>
              </Accordion>
            </Grid>}
          </Grid>
        </form>
        }
      </DialogContent>
      <DialogActions>
        <Grid container justifyContent="space-between">
          <Grid item>
            {booking && booking.id &&
            <Button
              type="button"
              className={classes.deleteButton}
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            {onOpenContract &&
            <Button
              type="button"
              color="default"
              disabled={!booking || !booking.id}
              className={classes.button}
              startIcon={<PdfIcon />}
              onClick={form.handleSubmit(openContract)}
            >{t("Contract")}</Button>}
          </Grid>
          <Grid item>
            <Button type="button" color="default" onClick={onCancel}>{t("Cancel")}</Button>
            <Button
              type="submit"
              color="primary"
              className={classes.button}
              startIcon={<SaveIcon />}
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
