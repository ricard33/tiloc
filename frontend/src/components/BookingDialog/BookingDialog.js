import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { bookingType, lodgingType } from "../../common/propTypesUtils";
import { Contacts as ContactsIcon, ExpandMore as ExpandMoreIcon, Forward as ForwardIcon } from "@mui/icons-material";
import { Controller, useForm } from "react-hook-form";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { computeBookingPrice, computeOptionsPrice, DecimalPrecision } from "../../common/priceUtils";
import { getDepositLabel } from "../../common/ownerPrefsUtils";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  Hidden,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import useWindowDimensions from "../../common/windowDimensions";
import { useConfirm } from "../../libs/MuiConfirm";
import { formatISO } from "../../common/tzUtils";
import Payments from "../Payments";
import { formatCurrency } from "../../common/intlUtils";
import OptionsList from "./OptionsList";
import {
  useCreateBookingMutation,
  useListBookingChannelsQuery,
  useListBookingStatusesQuery,
  useUpdateBookingMutation
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import "./BookingDialog.scss";
import BookingActions from "../BookingActions";


const BookingDialog = props => {
  const { booking, lodgings, guests: allGuests, onClose, onDelete, onOpenContract } = props;
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const { data: bookingStatuses } = useListBookingStatusesQuery();
  const { data: bookingChannels } = useListBookingChannelsQuery();
  const [createBooking] = useCreateBookingMutation();
  const [updateBooking] = useUpdateBookingMutation();
  const [totalPayment, setTotalPayment] = useState(Number(booking.total_payments));
  const confirm = useConfirm();
  const variant = "filled";
  const depositPercent = 30; // TODO load this from owner or lodging preferences

  // console.debug("booking", booking);
  console.assert(!!booking, "Booking not initialized");

  const setMultipleValues = object => Object.keys(object).forEach(function(key) {
    setValue(key, object[key]);
  });

  let lodging = booking?.lodging;

  const initialState = initializeDefaults(booking);

  const form = useForm({
    defaultValues: initialState
  });
  const { register, control, setValue, getValues, watch, formState } = form;
  const { errors, dirty /*isValid*/ } = formState;

  const formValues = getValues();
  // console.debug("formValues: ", formValues);

  const deposit = watch("deposit", initialState.deposit);
  const existingGuest = watch("guest_name", initialState.guest_name);
  const isFlatRate = watch("is_flat_rate", initialState.is_flat_rate);
  const duration = watch("duration", initialState.duration);
  const price = watch("price", initialState.price);
  const commissionFees = watch("commission_fees", initialState.price);
  const options = watch("options");
  const [includedInPriceOptions, excludedFromPriceOptions] = computeOptionsPrice(options, duration);
  // const fullPrice = watch("fullPrice", Number(price) + includedInPriceOptions);
  const fullPrice = Number(price) + includedInPriceOptions;
  const leftToPay = fullPrice - totalPayment - commissionFees;
  // console.log("options", options, fullPrice);

  const depositLabel = getDepositLabel(t, lodging && lodging.owner && lodging.owner.deposit_label) || t("Deposit");

  useEffect(() => {
    if (formValues.status_id === undefined && bookingStatuses) {
      setValue("status_id", bookingStatuses[0].id);
    }
  }, [bookingStatuses, formValues.status_id, setValue]);

  function initializeDefaults(booking) {
    if (booking) {
      let initialState = {
        ...booking
        //   status: { ...bookingStatuses.filter(x => x.id === booking.status_id)[0] },
        //   source: { ...bookingChannels.filter(x => x.id === booking.source_id)[0] }
      };

      lodging = { ...lodgings.filter(x => x.id === booking.lodging_id)[0] };

      // Provide defaults for new bookings
      // if (initialState.status_id === undefined) {
      //   initialState.status_id = bookingStatuses[0].id;
      //   initialState.status = bookingStatuses[0];
      // }
      if (initialState.lodging_id === null)
        initialState.lodging_id = 0;
      initialState.guest_contact = booking.guest_contact || "";
      initialState.guest_address = booking.guest_address || "";
      initialState.begin_date = parseISO(booking.begin_date || format(new Date(), "yyyy-MM-yy"));
      initialState.end_date = parseISO(booking.end_date || format(addDays(initialState.begin_date, initialState.duration || 7), "yyyy-MM-dd"));
      initialState.duration = booking.duration || differenceInCalendarDays(initialState.end_date, initialState.begin_date);
      initialState.daily_rate = booking.daily_rate || lodging?.daily_rate;
      initialState.is_flat_rate = booking.is_flat_rate || false;
      if (initialState.price === undefined)
        Object.assign(initialState, computeBookingPrice(initialState.begin_date, initialState.end_date,
          initialState.daily_rate, 0, 0, [], depositPercent));
      initialState.guaranty = booking.guaranty || lodging?.guaranty;
      initialState.commission_fees = booking.commission_fees || 0;
      initialState.adults = booking.adults || 2;
      initialState.children = booking.children || 0;
      initialState.babies = booking.babies || 0;
      initialState.source_id = booking.source_id || "";
      initialState.options = booking.options || [];
      initialState.arrival_details = booking.arrival_details ?? "";
      initialState.notes = booking.notes ?? "";

      // console.debug("initialState", initialState);
      return initialState;
    }
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
          const priceObj = computeBookingPrice(formValues.begin_date, formValues.end_date,
            formValues.daily_rate ?? (lodging ? lodging.daily_rate : 0), 0, 0, [], depositPercent);
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
      case "commission_fees":
        if (!data.target.value) {
          // setBalance(0);
        } else {
          let commission_fees = Number(data.target.value);
          if (commission_fees && commission_fees >= 0) {
            return commission_fees;
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
      : computeBookingPrice(formValues.begin_date, endDate, formValues.daily_rate ?? (lodging ? lodging.daily_rate : 0), 0, 0, [], depositPercent);
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
      : computeBookingPrice(newBooking.begin_date, newBooking.end_date, formValues.daily_rate ?? (lodging ? lodging.daily_rate : 0), 0, 0, [], depositPercent);
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

  function onCancelBooking() {
    props.onCancelBooking();
    setValue("cancelled", true);
  }

  function onUncancelBooking() {
    props.onUncancelBooking();
    setValue("cancelled", false);
  }

  function saveBooking(data, callback) {
    console.log("Submit: ", data);
    const submittedBooking = {
      ...data,
      begin_date: formatISO(data.begin_date),
      end_date: formatISO(data.end_date),
      lodging_id: data.lodging_id > 0 ? data.lodging_id : null,
      daily_rate: data.daily_rate.toFixed(2),
      price: data.price.toFixed(2),
      deposit: data.deposit.toFixed(2),
      guaranty: data.guaranty.toFixed(2),
      commission_fees: data.commission_fees.toFixed(2)
    };
    const action = booking.id ? updateBooking : createBooking;
    action(submittedBooking).then((result) => {
      if (result.error) {
        const error = result.error;
        console.error("Error saving booking", error);
        showError(t("Impossible to save the booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking saved"));
        if (callback)
          callback(submittedBooking);
      }
    });

  }

  function onSubmit(data) {
    saveBooking(data, submittedBooking => {
      console.debug("Closing...");
      onClose(submittedBooking);
    });
  }

  return (
    <Dialog
      className="booking-dialog"
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
          <Grid item xs={6} className="total-wrapper">
            <span className="total-price">
              {t("total = {{ fullPrice }}", { fullPrice: formatCurrency(fullPrice) })}</span>
            {(excludedFromPriceOptions) > 0 && (
              <span
                className="third-party-price"
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
              { /* BOOKING STATUS */}
              <Grid item sm={4} xs={12}>
                <FormControl className="full-width" variant={variant}>
                  <InputLabel id="status-label">{t("Booking status")}</InputLabel>
                  {bookingStatuses &&
                    <Controller
                      name="status_id"
                      control={control}
                      render={({ field }) =>
                        <Select
                          labelId="status-label"
                          margin="dense"
                          className="booking-status-select"
                          {...field}
                        >
                          {bookingStatuses.map(status => (
                            <MenuItem key={status.id} value={status.id}>
                              <span
                                className="booking-status-item"
                                style={{ background: "#" + status.color }}
                              >{status.name}</span>
                            </MenuItem>
                          ))}
                        </Select>}
                    />}
                </FormControl>
              </Grid>
              { /* LODGING */}
              <Grid item sm={8} xs={12}>
                <FormControl className="full-width" variant={variant}>
                  <InputLabel htmlFor="booking-lodging">{t("Lodging")}</InputLabel>
                  {lodgings &&
                    <Controller
                      name="lodging_id"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) =>
                        <Select
                          label={t("Lodging")}
                          margin="dense"
                          {...field}
                          onChange={(event) => field.onChange(handleChange(event))}
                        >
                          {lodgings.map(lodging => (
                            <MenuItem key={lodging.id} value={lodging.id}>{lodging.name}</MenuItem>
                          ))}
                        </Select>}
                    />}
                </FormControl>
              </Grid>
              { /* GUEST */}
              <Grid item lg={6} xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="guest-header">
                    <Typography gutterBottom className="accordion-heading">{t("Guest")}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1}>
                      <Grid item xs={1}>
                        <ContactsIcon />
                      </Grid>
                      <Grid item xs={11}>
                        <FormControl className="full-width" variant={variant}>
                          <InputLabel htmlFor="booking-existing-guest">{t("Existing guest")}</InputLabel>
                          {allGuests &&
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
                            </Select>}
                          <FormHelperText>{t("Select an existing guest to automatically fill its information")}</FormHelperText>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Controller
                          name="guest_name"
                          control={control}
                          rules={{ required: true }}
                          render={({ field }) =>
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
                          render={({ field }) =>
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
                          render={({ field }) =>
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
              { /* BOOKING DETAILS */}
              <Grid item lg={6} xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="booking-header">
                    <Typography gutterBottom className="accordion-heading">{t("Booking details")}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1}>
                      {/* Dates and nights */}
                      <Grid item xs={12}>
                        <FormControl className="full-width" variant={variant}>
                          <InputLabel htmlFor="duration">{t("Nights")}</InputLabel>
                          <Controller
                            name="duration"
                            control={control}
                            rules={{ valueAsNumber: true }}
                            render={({ field }) =>
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
                                <DatePicker
                                  format="dd/MM/yyyy"
                                  renderInput={(props) => <TextField
                                    label={t("Arrival")}
                                    variant={variant} {...props}
                                  />}
                                  margin="dense"
                                  selected={field.value}
                                  {...field}
                                  onChange={(date) => handleBeginDateChange(date, field.onChange)}
                                />}
                            />
                          </Grid>
                          <Hidden smDown>
                            <Grid item sm={2} xs={12} style={{ "textAlign": "center" }}>
                              <ForwardIcon />
                            </Grid>
                          </Hidden>
                          <Grid item sm={5} xs={12}>
                            <Controller
                              control={control}
                              name="end_date"
                              render={({ field }) =>
                                <DatePicker
                                  format="dd/MM/yyyy"
                                  renderInput={(props) => <TextField
                                    label={t("Departure")}
                                    variant={variant} {...props}
                                  />}
                                  margin="dense"
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
                          <Grid item sm={7} xs={12} className="flex-box-stretched">
                            <span>{t("{{count}} night", { count: duration })}&nbsp;x&nbsp;</span>
                            <Controller
                              name="daily_rate"
                              control={control}
                              rules={{ min: 1, valueAsNumber: true }}
                              render={({ field }) =>
                                <TextField
                                  className="price-input"
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
                            <div className="spacer" />
                            =
                            <div className="spacer" />
                          </Grid>}
                        <Grid item sm={5} xs={12} className="flex-box-align-left">
                          <Controller
                            control={control}
                            name="price"
                            rules={{ valueAsNumber: true }}
                            render={({ field }) =>
                              <TextField
                                className="price-input"
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
                          <div className="spacer" />
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
                      <Grid item xs={12} className="flex-box-align-left">
                        <Typography>
                          {includedInPriceOptions ? t("Included options: {{amount}}", { amount: formatCurrency(includedInPriceOptions) }) : ""}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} className="flex-box-align-left">
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
                            valueAsNumber: true
                          }}
                          render={({ field }) =>
                            <TextField
                              error={!!errors.deposit}
                              helperText={errors.deposit && errors.deposit.message}
                              className="price-input"
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
                        <div className="spacer" />
                        <Typography>
                          {fullPrice ? t("Balance: {{amount}}", { amount: formatCurrency(fullPrice - deposit) }) : ""}
                        </Typography>
                      </Grid>
                      { /* commission fees */}
                      <Grid item xs={12} className="flex-box-align-left">
                        <Controller
                          control={control}
                          name="commission_fees"
                          rules={{
                            min: { value: 0, message: t("Commission fees can't be negative") },
                            valueAsNumber: true
                          }}
                          render={({ field }) =>
                            <TextField
                              error={!!errors.commission_fees}
                              helperText={errors.commission_fees && errors.commission_fees.message}
                              className="price-input"
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
                      <Grid item xs={12} className="flex-box-align-left">
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
                        <div className="spacer" />
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
                        <div className="spacer" />
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
              { /* OPTIONS */}
              <Grid item lg={6} xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="options-content" id="options-header">
                    <Typography gutterBottom className="accordion-heading">{t("Options")}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <OptionsList form={form} duration={duration} bookingId={booking.id} variant={variant} />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
              { /* COMPLEMENTS */}
              <Grid item lg={6} xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />} aria-controls="complements-content"
                    id="complements-header"
                  >
                    <Typography gutterBottom className="accordion-heading">{t("Complements")}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1}>
                      {/* statistics */}
                      <Grid item xs={12}>
                        <FormControl className="full-width" variant={variant}>
                          <InputLabel htmlFor="booking-source">{t("Statistics")}</InputLabel>
                          {bookingChannels &&
                            <Controller
                              name="source_id"
                              control={control}
                              render={({ field }) =>
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
                            />}
                        </FormControl>
                      </Grid>
                      {/* arrival_details */}
                      <Grid item xs={12}>
                        <Controller
                          control={control}
                          name="arrival_details"
                          render={({ field }) =>
                            <TextField
                              fullWidth
                              inputRef={register("arrival_details")}
                              label={t("Arrival details")}
                              margin="dense"
                              variant={variant}
                              {...field}
                            />}
                        />
                      </Grid>
                      {/* notes */}
                      <Grid item xs={12}>
                        <Controller
                          control={control}
                          name="notes"
                          render={({ field }) =>
                            <TextField
                              fullWidth
                              inputRef={register("notes")}
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
              { /* PAYMENTS */}
              {booking.id &&
                <Grid item lg={6} xs={12}>
                  <Accordion defaultExpanded>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />} aria-controls="complements-content"
                      id="complements-header"
                    >
                      <Typography gutterBottom className="accordion-heading">{t("Payments")}</Typography>
                      <Typography gutterBottom className="accordion-secondary-heading">
                        {leftToPay > 0 &&
                          <span
                            className="left-to-pay"
                          >{t("Left to pay: {{amount}}", { amount: formatCurrency(leftToPay) })}</span>}
                        {leftToPay < 0 &&
                          <span
                            className="too-perceived"
                          >{t("Too perceived: {{amount}}", { amount: formatCurrency(-leftToPay) })}</span>}
                        {leftToPay === 0 && t("Fully paid")}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Payments
                        bookingId={booking.id} onPaymentsUpdate={(total) => {
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
        <BookingActions
          booking={booking} onClose={onClose} onDelete={onDelete}
          onSave={form.handleSubmit(onSubmit)}
          onOpenContract={onOpenContract ? form.handleSubmit(openContract) : undefined}
          onCancelBooking={onCancelBooking}
          onUncancelBooking={onUncancelBooking}
        />

        {/*<Grid container justifyContent="space-between">*/}
        {/*  <Grid item>*/}
        {/*    {booking && booking.id &&*/}
        {/*      <Button*/}
        {/*        type="button"*/}
        {/*        className="delete-button"*/}
        {/*        color="secondary"*/}
        {/*        startIcon={<DeleteIcon />}*/}
        {/*        onClick={onDelete}*/}
        {/*      >{t("Delete")}</Button>}*/}
        {/*  </Grid>*/}
        {/*  <Grid item>*/}
        {/*    {onOpenContract &&*/}
        {/*      <Button*/}
        {/*        type="button"*/}
        {/*        disabled={!booking || !booking.id}*/}
        {/*        className="button"*/}
        {/*        startIcon={<PdfIcon />}*/}
        {/*        onClick={form.handleSubmit(openContract)}*/}
        {/*      >{t("Contract")}</Button>}*/}
        {/*  </Grid>*/}
        {/*  <Grid item>*/}
        {/*    <Button type="button" onClick={onCancel}>{t("Cancel")}</Button>*/}
        {/*    <Button*/}
        {/*      type="submit"*/}
        {/*      color="primary"*/}
        {/*      className="button"*/}
        {/*      startIcon={<SaveIcon />}*/}
        {/*      onClick={form.handleSubmit(onSubmit)}*/}
        {/*    >{t("Save")}</Button>*/}
        {/*  </Grid>*/}
        {/*</Grid>*/}
      </DialogActions>
    </Dialog>
  );
};

BookingDialog.propTypes = {
  booking: bookingType,
  guests: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    contact: PropTypes.string,
    address: PropTypes.string
  })),
  lodgings: PropTypes.arrayOf(lodgingType),
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onOpenContract: PropTypes.func,
  onCancelBooking: PropTypes.func,
  onUncancelBooking: PropTypes.func
};

export default BookingDialog;
