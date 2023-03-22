import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Contacts as ContactsIcon, ExpandMore as ExpandMoreIcon, Forward as ForwardIcon } from "@mui/icons-material";
import { Controller, useForm, useFormState } from "react-hook-form";
import { addDays, differenceInCalendarDays } from "date-fns";
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
import Payments from "../Payments";
import { formatCurrency } from "../../common/intlUtils";
import OptionsList from "./OptionsList";
import {
  useCreateBookingMutation,
  useGetOwnerQuery,
  useListBookingChannelsQuery,
  useListBookingStatusesQuery,
  useUpdateBookingMutation
} from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import "./BookingDialog.scss";
import BookingActions from "../BookingActions";
import { Booking, Lodging, Service } from "../../types";
import { usePageUnloadAlert } from "../../common/formUtils";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { FormContainer, TextFieldElement } from "react-hook-form-mui";


type BookingDialogProps = {
  booking: Booking,
  guests: {
    name: string,
    contact: string,
    address: string
  }[],
  lodgings: Lodging[],
  allOptions: Service[],
  onClose: () => void,
  onDelete: () => void,
  onOpenContract?: (booking: Booking) => void,
  onCancelBooking?: () => void,
  onUncancelBooking?: () => void
};

const BookingDialog: React.FC<BookingDialogProps> = props => {
  const { booking, lodgings, allOptions, guests: allGuests, onClose, onDelete, onOpenContract } = props;
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const {
    data: owner
  } = useGetOwnerQuery(booking?.lodging ? booking!.lodging.owner_id : -1, { skip: typeof booking === "undefined" || typeof booking.lodging === "undefined" });
  const { data: bookingStatuses } = useListBookingStatusesQuery();
  const { data: bookingChannels } = useListBookingChannelsQuery();
  const [createBooking] = useCreateBookingMutation();
  const [updateBooking] = useUpdateBookingMutation();
  const [totalPayment, setTotalPayment] = useState(Number(booking.total_payments));
  const variant = "filled";
  const depositPercent = 30; // TODO load this from owner or lodging preferences

  // console.debug("booking", booking);
  console.assert(!!booking, "Booking not initialized");

  const setMultipleValues = (object: Partial<Booking>) => Object.keys(object).forEach(function(key) {
    setValue(key as any, (object as any)[key]);
  });

  let lodging: Lodging | undefined = booking.lodging;

  const initialState = initializeDefaults(booking);

  const formContext = useForm<Booking>({
    defaultValues: initialState
  });
  const { register, control, setValue, getValues, watch, formState } = formContext;
  const { errors, isDirty /*isValid*/ } = formState;
  const { dirtyFields } = useFormState({
    control
  });

  console.log("ERRORS", errors);
  usePageUnloadAlert(Object.keys(dirtyFields).length > 0);
  const unsavedChangesConfirm = useUnsavedChangesConfirm();

  const formValues = getValues();
  // console.debug("formValues: ", formValues);

  const deposit = watch("deposit", initialState.deposit);
  const existingGuest = watch("guest_name", initialState.guest_name);
  const isFlatRate = watch("is_flat_rate", initialState.is_flat_rate);
  const duration = watch("duration", initialState.duration);
  const price = watch("price", initialState.price);
  const commissionFees = watch("commission_fees", initialState.commission_fees);
  const options = watch("options");
  const [includedInPriceOptions, excludedFromPriceOptions] = computeOptionsPrice(options, duration);
  // const fullPrice = watch("fullPrice", Number(price) + includedInPriceOptions);
  const fullPrice = Number(price) + includedInPriceOptions;
  const leftToPay = fullPrice - totalPayment - (commissionFees ?? 0);
  // console.log("options", options, fullPrice);

  const depositLabel = owner ? getDepositLabel(t, owner.deposit_label) : t("Deposit");

  useEffect(() => {
    if (formValues.status_id === undefined && bookingStatuses) {
      setValue("status_id", bookingStatuses[0].id);
    }
  }, [bookingStatuses, formValues.status_id, setValue]);

  function initializeDefaults(booking: Booking) {
    let initialState: Booking = {
      ...booking
      //   status: { ...bookingStatuses.filter(x => x.id === booking.status_id)[0] },
      //   source: { ...bookingChannels.filter(x => x.id === booking.source_id)[0] }
    };

    lodging = booking.lodging_id ? { ...lodgings.filter(x => x.id === booking.lodging_id)[0] } : undefined;

    // Provide defaults for new bookings
    // if (initialState.status_id === undefined) {
    //   initialState.status_id = bookingStatuses[0].id;
    //   initialState.status = bookingStatuses[0];
    // }
    // @ts-ignore
    initialState.lodging_id = booking.lodging_id || "";
    initialState.guest_name = booking.guest_name || "";
    initialState.guest_contact = booking.guest_contact || "";
    initialState.guest_address = booking.guest_address || "";
    initialState.begin_date = booking.begin_date || new Date();
    initialState.end_date = booking.end_date || addDays(initialState.begin_date, initialState.duration || 7);
    initialState.duration = booking.duration || differenceInCalendarDays(initialState.end_date, initialState.begin_date);
    initialState.daily_rate = booking.daily_rate || (lodging ? lodging.daily_rate : 0);
    initialState.is_flat_rate = booking.is_flat_rate || false;
    if (initialState.price === undefined)
      Object.assign(initialState, computeBookingPrice(initialState.begin_date, initialState.end_date,
        initialState.daily_rate, 0, 0, [], depositPercent).price);
    initialState.guaranty = booking.guaranty || (lodging ? lodging.guaranty : 0);
    initialState.commission_fees = booking.commission_fees || 0;
    initialState.adults = booking.adults || 2;
    initialState.children = booking.children || 0;
    initialState.babies = booking.babies || 0;
    initialState.source_id = booking.source_id || ("" as any);  // FIXME remove any
    initialState.options = booking.options || (!booking.id ? allOptions.filter((o: Service) => o.auto_add_booking) : []);
    initialState.arrival_details = booking.arrival_details ?? "";
    initialState.notes = booking.notes ?? "";

    // console.debug("initialState", initialState);
    return initialState;
  }

  /**
   * Handle values AFTER validation. This fonction can't change the type or the value, except using setValue().
   * NOTE: this is true when using rhf-mui fields only.
   * TODO: upgrade all input to rhf-mui.
   * @param fieldName
   * @param value
   */
  function handleChange(fieldName: string, value: string | number | boolean) {
    // here, value is always a string or a boolean. Why ?
    // console.log("VALUE", fieldName, value, typeof value, parseFloat(value as string), Number(value));
    switch (fieldName) {
      case "status_id": {
        return value;
      }
      case "lodging_id": {
        const formValues = getValues();
        value = Number(value);
        lodging = lodgings.filter(x => x.id === value)[0];
        if (!isFlatRate && formValues.daily_rate !== lodging.daily_rate) {
          const { price: priceObj } = computeBookingPrice(formValues.begin_date, formValues.end_date, lodging.daily_rate, 0, 0, [], depositPercent);
          setMultipleValues(priceObj);
        }
        return value;
      }
      case "existing-guest":
        const guest = allGuests.filter(guest => guest.name === value);
        if (guest) {
          setValue("guest_name", guest[0].name);
          setValue("guest_contact", guest[0].contact);
          setValue("guest_address", guest[0].address);
        }
        break;
      case "duration": {
        const duration = Number(value);
        onDurationChange(duration);
        return duration;
      }
      case "daily_rate":
        value = parseFloat(value as string);
        if (!isNaN(value)) {
          const { price: priceObj } = computeBookingPrice(formValues.begin_date, formValues.end_date, value, 0, 0, [], depositPercent);
          setMultipleValues(priceObj);
        }
        break;
      case "price":
        value = parseFloat(value as string);
        if (!isNaN(value)) {
          setValue("daily_rate", DecimalPrecision.round(value / getValues().duration));
          setValue("price", value);
          setValue("is_flat_rate", true);
        }
        break;
      case "is_flat_rate":
        if (value)
          return true;
        else {
          const formValues = getValues();
          const { price: priceObj } = computeBookingPrice(formValues.begin_date, formValues.end_date,
            formValues.daily_rate ?? (lodging ? lodging.daily_rate : 0), 0, 0, [], depositPercent);
          setMultipleValues(priceObj);
          return false;
        }
      // case "deposit":
      //   if (value) {
      //     let deposit = Number(value);
      //     const price = getValues().price ?? 0;
      //     if (deposit && deposit >= 0) {
      //       if (deposit > price)
      //         deposit = price;
      //       return deposit;
      //     }
      //   }
      //   return 0;
      // case "commission_fees":
      //   if (value) {
      //     let commission_fees = Number(value);
      //     if (commission_fees && commission_fees >= 0) {
      //       return commission_fees;
      //     }
      //   }
      //   return 0;
      case "adults":
      case "children":
      case "babies":
        // setBooking({ ...booking, [fieldName]: Number(value) });
        return Number(value);
      case "source":
        // value = Number(value) > 0 ? value : null;
        // setBooking({ ...booking, [fieldName]: Number(value) });
        return value;
      default:
        console.warn("Unhandled input:", fieldName);
        return value;
    }
  }

  function onDurationChange(newValue: number) {
    const formValues = getValues();
    const duration = Number(newValue);
    const endDate = addDays(formValues.begin_date, duration);
    const priceObj = formValues.is_flat_rate ? { daily_rate: (formValues.price ?? 0) / duration }
      : computeBookingPrice(formValues.begin_date, endDate, formValues.daily_rate ?? (lodging ? lodging.daily_rate : 0), 0, 0, [], depositPercent).price;
    setMultipleValues(priceObj);
    setValue("end_date", endDate);
    return duration;
  }

  function isValidDate(d: Date | null) {
    return d instanceof Date && !isNaN(d.valueOf());
  }

  function onDateChange(newDate: Date | null, fieldName: "begin_date" | "end_date") {
    const formValues = getValues();
    if (!isValidDate(newDate))
      return newDate;
    const newBooking = {
      ...formValues,
      // [fieldName]: format(newDate, "yyyy-MM-dd")
      [fieldName]: newDate
    };
    const duration = differenceInCalendarDays(newBooking.end_date, newBooking.begin_date);
    const priceObj = newBooking.is_flat_rate ? { daily_rate: (newBooking.price ?? 0) / duration }
      : computeBookingPrice(newBooking.begin_date, newBooking.end_date, formValues.daily_rate ?? (lodging ? lodging.daily_rate : 0), 0, 0, [], depositPercent).price;
    setMultipleValues(priceObj);
    setValue("duration", duration);
    return newBooking[fieldName];
  }

  function handleBeginDateChange(newDate: Date | null, onChange: (date: Date | null) => void) {
    onChange(newDate);
    return onDateChange(newDate, "begin_date");
  }

  function handleEndDateChange(newDate: Date | null, onChange: (date: Date | null) => void) {
    onChange(newDate);
    return onDateChange(newDate, "end_date");
  }

  function openContract() {
    if (onOpenContract) {
      if (isDirty) {
        unsavedChangesConfirm()
          .then(() => {
            formContext.handleSubmit((data: Booking) => saveBooking(data, submittedBooking => onOpenContract(submittedBooking)));
          });
      } else
        onOpenContract(booking);
    }
  }

  function onCancelBooking() {
    props.onCancelBooking?.();
    setValue("cancelled", true);
  }

  function onUncancelBooking() {
    props.onUncancelBooking?.();
    setValue("cancelled", false);
  }

  function saveBooking(data: Booking, callback: (booking: Booking) => void) {
    console.log("Submit: ", data);
    const submittedBooking = {
      ...data,
      source_id: data.source_id ? data.source_id : undefined,
    };
    const action = booking.id ? updateBooking : createBooking;
    action(submittedBooking).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error saving booking", error);
        showError(t("Impossible to save the booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking saved"));
        if (callback)
          callback(submittedBooking);
      }
    });

  }

  function onSubmit(data: Booking) {
    saveBooking(data, () => {
      console.debug("Closing...");
      onClose();
    });
  }

  function onCloseHandler() {
    if (isDirty) {
      unsavedChangesConfirm().then(onClose);
    } else onClose();
  }

  return (
    <Dialog
      className="booking-dialog"
      onClose={onCloseHandler}
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
          <FormContainer
            formContext={formContext}
            onSuccess={onSubmit}
          >
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
                  {bookingStatuses && formValues.status_id &&
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
                          onChange={(event) => field.onChange(handleChange(event.target.name, event.target.value))}
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
                              value={existingGuest ? existingGuest : "-- Choose --"}
                              onChange={event => handleChange(event.target.name, event.target.value)}
                            >
                              <option key={"-- Choose --"} value={"-- Choose --"}>{t("-- Choose --")}</option>
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
                            render={({ field }) =>
                              <Select
                                label={t("Nights")}
                                margin="dense"
                                {...field}
                                onChange={(event) => field.onChange(handleChange(event.target.name, Number(event.target.value)))}
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
                                  renderInput={(props) =>
                                    <TextField
                                      label={t("Arrival")}
                                      variant={variant} {...props}
                                    />}
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
                                  renderInput={(props) =>
                                    <TextField
                                      label={t("Departure")}
                                      variant={variant} {...props}
                                    />}
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
                            <TextFieldElement
                              control={control}
                              name={"daily_rate"}
                              label={t("Daily rate")}
                              className="price-input"
                              type={"number"}
                              required
                              validation={{
                                min: { value: 0, message: t("Rate can't be negative") },
                                validate: { validateNumber: (v) => !isNaN(parseFloat(v)) }
                              }}
                              InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                              margin="dense"
                              variant={variant}
                              onChange={event => handleChange(event.target.name, event.target.value)}
                            />
                            <div className="spacer" />
                            =
                            <div className="spacer" />
                          </Grid>}
                        <Grid item sm={5} xs={12} className="flex-box-align-left">
                          <TextFieldElement
                            control={control}
                            name={"price"}
                            label={t("Total")}
                            className="price-input"
                            type={"number"}
                            required
                            validation={{
                              min: { value: 0, message: t("Price can't be negative") },
                              validate: { validateNumber: (v) => !isNaN(parseFloat(v)) }
                            }}
                            InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                            margin="dense"
                            variant={variant}
                            onChange={event => handleChange(event.target.name, event.target.value)}
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
                                    // defaultChecked={initialState.is_flat_rate}
                                    {...field}
                                    checked={field.value}
                                    onChange={event => field.onChange(handleChange(event.target.name, event.target.checked))}
                                  />}
                              />
                            }
                            label={t("Flat rate")}
                            labelPlacement="start"
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
                        <TextFieldElement
                          control={control}
                          name={"deposit"}
                          label={depositLabel}
                          className="price-input"
                          type={"number"}
                          // required
                          validation={{
                            min: {
                              value: 0,
                              message: t("{{depositLabel}} can't be negative", { depositLabel: depositLabel })
                            },
                            max: {
                              value: price ?? 0,
                              message: t("{{depositLabel}} can't be higher than price", { depositLabel: depositLabel })
                            },
                            validate: { validateNumber: (v) => !isNaN(parseFloat(v)) }
                          }}
                          InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                          margin="dense"
                          variant={variant}
                        />
                        <div className="spacer" />
                        <Typography>
                          {fullPrice ? t("Balance: {{amount}}", { amount: formatCurrency(fullPrice - (deposit ?? 0)) }) : ""}
                        </Typography>
                      </Grid>
                      { /* commission fees */}
                      <Grid item xs={12} className="flex-box-align-left">
                        <TextFieldElement
                          control={control}
                          name={"commission_fees"}
                          label={t("Commission fees")}
                          className="price-input"
                          type={"number"}
                          // required
                          validation={{
                            min: { value: 0, message: t("Commission fees can't be negative") },
                            validate: { validateNumber: (v) => !isNaN(parseFloat(v)) }
                          }}
                          InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                          margin="dense"
                          variant={variant}
                        />
                      </Grid>
                      {/* number of persons */}
                      <Grid item xs={12} className="flex-box-align-left">
                        <FormControl variant={variant}>
                          <InputLabel htmlFor="adults">{t("Adults")}</InputLabel>
                          <Controller
                            name="adults"
                            control={control}
                            rules={{}}
                            render={({ field }) =>
                              <Select
                                label={t("Adults")}
                                margin="dense"
                                native
                                {...field}
                                onChange={event => field.onChange(handleChange(event.target.name, Number(event.target.value)))}
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
                            render={({ field }) =>
                              <Select
                                label={t("Children")}
                                margin="dense"
                                native
                                {...field}
                                onChange={event => field.onChange(handleChange(event.target.name, Number(event.target.value)))}
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
                            render={({ field }) =>
                              <Select
                                label={t("Babies")}
                                margin="dense"
                                native
                                {...field}
                                onChange={event => field.onChange(handleChange(event.target.name, Number(event.target.value)))}
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
                        {allOptions &&
                          <OptionsList form={formContext} duration={duration} allOptions={allOptions} variant={variant} />}
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
                                  onChange={event => field.onChange(handleChange(event.target.name, event.target.value))}
                                >
                                  <MenuItem key={0} value={0} />
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
                              // inputRef={register("arrival_details")}
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
                              // inputRef={register("notes")}
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
          </FormContainer>
        }
      </DialogContent>
      <DialogActions>
        <BookingActions
          booking={booking} onClose={onCloseHandler} onDelete={onDelete}
          onSave={formContext.handleSubmit(onSubmit)}
          onOpenContract={() => openContract()}
          onCancelBooking={onCancelBooking}
          onUncancelBooking={onUncancelBooking}
        />
      </DialogActions>
    </Dialog>
  );
};

export default BookingDialog;
