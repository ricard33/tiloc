import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Contacts as ContactsIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Forward as ForwardIcon
} from "@mui/icons-material";
import BackspaceIcon from "@mui/icons-material/Backspace";
import { Controller, useForm, useFormState } from "react-hook-form";
import { addDays, differenceInCalendarDays } from "date-fns";
import { computeBookingPrice, computeOptionsPrice, DecimalPrecision } from "../../common/priceUtils";
import { getDepositLabel } from "../../common/propertyPrefsUtils";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  AppBar,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  Hidden,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import useWindowDimensions from "../../common/windowDimensions";
import Payments from "../Payments";
import { formatCurrency } from "../../common/intlUtils";
import OptionsList from "./OptionsList";
import { useCreateBookingMutation, useListBookingChannelsQuery, useUpdateBookingMutation } from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import "./BookingDialog.scss";
import BookingActions from "../BookingActions";
import { Booking, BookingStatus, Lodging, Service, User } from "../../types";
import { usePageUnloadAlert } from "../../common/formUtils";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import {
  AutocompleteElement,
  CheckboxElement,
  DatePickerElement,
  FormContainer,
  SelectElement,
  TextFieldElement
} from "react-hook-form-mui";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { getBookingStatuses } from "../../common/statusUtils";
import CloseIcon from "@mui/icons-material/Close";


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
  onOpenContract?: (booking: Booking) => void,
  onCancelBooking?: () => void,
  onUncancelBooking?: () => void
};

const BookingDialog: React.FC<BookingDialogProps> = props => {
  const { booking, lodgings, allOptions, guests: allGuests, onClose, onOpenContract } = props;
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const { data: bookingChannels } = useListBookingChannelsQuery();
  const [createBooking] = useCreateBookingMutation();
  const [updateBooking] = useUpdateBookingMutation();
  const [totalPayment, setTotalPayment] = useState(Number(booking.total_payments));
  const variant = "outlined";
  const margin = "none";
  const depositPercent = 30; // TODO load this from lodging preferences
  const bookingStatuses = getBookingStatuses();
  const [customizeTouristTax, setCustomizeTouristTax] = useState(typeof booking.custom_tourist_tax !== "undefined");
  const [showTitle, setShowTitle] = useState(true);

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
  const { register, control, setValue, getValues, watch, formState, reset } = formContext;
  const { errors, isDirty /*isValid*/ } = formState;
  const { dirtyFields } = useFormState({
    control
  });

  // console.log("ERRORS", errors);
  // console.log("isDirty: ", isDirty, dirtyFields);
  // console.log("defaultValues: ", initialState);
  // console.log("values: ", getValues());
  // console.log("DIFF", filterObject(deepDiffMapper.map(initialState, getValues()),
  //   (value) => value && value?.type !== "unchanged"));

  usePageUnloadAlert(Object.keys(dirtyFields).length > 0);
  const unsavedChangesConfirm = useUnsavedChangesConfirm();

  const formValues = getValues();
  // console.debug("formValues: ", formValues);

  const deposit = watch("deposit", initialState.deposit);
  const isFlatRate = watch("is_flat_rate", initialState.is_flat_rate);
  const duration = watch("duration", initialState.duration);
  const price = watch("price", initialState.price);
  const commissionFees = watch("commission_fees", initialState.commission_fees);
  const touristTax = watch("tourist_tax", initialState.tourist_tax);
  const options = watch("options");
  const [includedInPriceOptions, excludedFromPriceOptions] = computeOptionsPrice(options, duration);
  // const fullPrice = watch("fullPrice", Number(price) + includedInPriceOptions);
  const fullPrice = Number(price) + includedInPriceOptions;
  const leftToPay = fullPrice + (lodging?.tourist_tax_included_in_payment ? touristTax : 0) - totalPayment - (commissionFees ?? 0);
  // console.log("options", options, fullPrice);

  const depositLabel = user ? getDepositLabel(t, user.account.deposit_label) : t("Deposit");

  function initializeDefaults(booking: Booking) {
    lodging = booking.lodging_id ? { ...lodgings.filter(x => x.id === booking.lodging_id)[0] } : undefined;

    // Only include editable fields because to make `isDirty` reseted to false working after a submit
    // ==> dirty state is computed comparing default values and stored values (output of getValues())
    let { price_with_options, left_to_pay, modified, computed_tourist_tax, guests, ...initialState }: Booking = booking;

    // Provide defaults for new bookings
    initialState.status = booking.status || BookingStatus.NotAvailable.name;
    initialState.lodging_id = booking.lodging_id || ("" as any);
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
    initialState.source_id = booking.source_id || ("" as any);
    initialState.options = booking.options || (!booking.id ? allOptions.filter((o: Service) => lodging?.default_services.includes(o.reference)) : []);
    initialState.arrival_details = booking.arrival_details ?? "";
    initialState.notes = booking.notes ?? "";

    // console.debug("initialState", initialState);
    return initialState;
  }

  function computeTouristTax() {
    if (typeof lodging === "undefined")
      return 0;
    const values = getValues();
    let daily_rate = lodging.max_daily_tourist_tax;
    if (!lodging.is_flat_rate_tourist_tax) {
      if (values.adults + values.children + values.babies > 0) {

        daily_rate = Math.round(values.price!
            / values.duration
            / (values.adults + values.children + values.babies)
            * lodging.tourist_tax_rate)
          / 100;

        daily_rate = Math.min(daily_rate, lodging.max_daily_tourist_tax);
      } else
        daily_rate = 0;
    }
    // return daily_rate * values.duration * values.adults;
    setValue("tourist_tax", daily_rate * values.duration * values.adults);
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
        computeTouristTax();
        return value;
      }
      case "existing-guest":
        const guest = allGuests.filter(guest => guest.name === value);
        // console.log(guest, typeof guest);
        if (guest && guest.length > 0) {
          setValue("guest_name", guest[0].name);
          setValue("guest_contact", guest[0].contact);
          setValue("guest_address", guest[0].address);
        }
        break;
      case "duration": {
        const duration = Number(value);
        onDurationChange(duration);
        computeTouristTax();
        return duration;
      }
      case "daily_rate":
        value = parseFloat(value as string);
        if (!isNaN(value)) {
          const { price: priceObj } = computeBookingPrice(formValues.begin_date, formValues.end_date, value, 0, 0, [], depositPercent);
          setMultipleValues(priceObj);
          computeTouristTax();
        }
        break;
      case "price":
        value = parseFloat(value as string);
        if (!isNaN(value)) {
          setValue("daily_rate", DecimalPrecision.round(value / getValues().duration));
          setValue("price", value);
          setValue("is_flat_rate", true);
          computeTouristTax();
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
          computeTouristTax();
          return false;
        }
      case "adults":
      case "children":
      case "babies":
        computeTouristTax();
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
    computeTouristTax();
    return newBooking[fieldName];
  }

  function handleSave(closeDialog: boolean) {
    console.log("handleSave");
    return new Promise<Booking>((resolve) => {
      console.log("promise : run async funtion");
      formContext.handleSubmit(
        async (data: Booking) => await saveBooking(data).then((booking) => {
          console.log("Booking saved");
          resolve(booking);
        }))().then(() => closeDialog && onClose());
    });
  }

  function onCancelBooking() {
    props.onCancelBooking?.();
    setValue("cancelled", true);
  }

  function onUncancelBooking() {
    props.onUncancelBooking?.();
    setValue("cancelled", false);
  }

  async function saveBooking(data: Booking, callback?: (booking: Booking) => void) {
    console.log("Submit: ", data);
    const submittedBooking = {
      ...data,
      source_id: data.source_id ? data.source_id : undefined
    };
    const action = booking.id ? updateBooking : createBooking;
    let result = await action(submittedBooking);
    if ((result as any).error) {
      const error = (result as any).error;
      console.error("Error saving booking", error);
      showError(t("Impossible to save the booking: ") + fetchErrorDecode(error));
      throw Error("Cant save booking");
    } else {
      showSuccess(t("Booking saved"));
      if (callback)
        callback(submittedBooking);
      return submittedBooking;
    }
  }

  function onSubmit(data: Booking) {
    return saveBooking(data, () => {
      console.debug("Closing...");
      onClose();
    });
  }

  function onCloseHandler() {
    if (isDirty) {
      unsavedChangesConfirm().then(onClose);
    } else onClose();
  }

  const fullScreen = width < 800;

  function onCustomizeTouristTaxHandler() {
    console.log("onCustomizeTouristTaxHandler");
    setCustomizeTouristTax(!customizeTouristTax);
    if (customizeTouristTax) {
      console.log("set custom_tourist_tax to undefined");
      setValue("custom_tourist_tax", undefined, { shouldDirty: true });
      setValue("tourist_tax", getValues()["computed_tourist_tax"]);
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  const dialogTitle = booking && booking.id ? t("Modify") : t("Add");
  return (
    <Dialog
      className="booking-dialog"
      onClose={onCloseHandler}
      aria-labelledby="simple-dialog-title"
      open={!!booking}
      maxWidth={width < 1200 ? "md" : "lg"}
      fullScreen={fullScreen}
    >
      {fullScreen ?
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={onCloseHandler}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            {showTitle &&
              <>
                <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                  {dialogTitle}
                </Typography>
                {booking.cancelled &&
                  <span style={{ fontSize: "small", color: "red", flex: 1 }}>{t("CANCELLED")}</span>
                }
              </>}
            <BookingActions
              booking={booking} isDirty={isDirty} onReset={reset}
              onSave={handleSave}
              onCancelBooking={onCancelBooking} onUncancelBooking={onUncancelBooking}
              onOpenContract={onOpenContract}
              onConfirmCancellation={(confirm) => setShowTitle(!confirm)}
              primaryColor="inherit"
            />
          </Toolbar>
        </AppBar>
        :
        <DialogTitle id="simple-dialog-title">
          <Grid justifyContent="space-between" container spacing={4}>
            <Grid item xs={6}>
              {dialogTitle}
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
      }
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
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) =>
                      <Select
                        labelId="status-label"
                        margin={margin}
                        label={t("Booking status")}
                        className="booking-status-select"
                        {...field}
                        // TODO fix type
                        onChange={event => field.onChange(event as never)}
                      >
                        {bookingStatuses.map(status => (
                          <MenuItem key={status.name} value={status.name}>
                            <span
                              className="booking-status-item"
                              style={{ background: status.color }}
                            >{status.getLabel(t)}</span>
                          </MenuItem>
                        ))}
                      </Select>}
                  />
                </FormControl>
              </Grid>
              { /* LODGING */}
              <Grid item sm={8} xs={12}>
                {lodgings &&
                  <SelectElement
                    control={control}
                    name="lodging_id"
                    label={t("Lodging")}
                    className="full-width"
                    margin={margin}
                    variant={variant}
                    options={lodgings.map(lodging => (
                      { id: lodging.id, label: lodging.name }
                    ))}
                    onChange={(value) => handleChange("lodging_id", value)}
                  />}
              </Grid>
              { /* GUEST */}
              <Grid item lg={6} xs={12}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="guest-header">
                    <Typography gutterBottom className="accordion-heading">{t("Guest")}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={1}>
                      <Grid item xs={12}>
                        <AutocompleteElement
                          control={control}
                          name="guest_name"
                          label={t("Full guest name")}
                          rules={{ required: true }}
                          options={allGuests.map((g) => g.name)}
                          autocompleteProps={{
                            freeSolo: true,
                            onChange: (event: any, newValue: string) => handleChange("existing-guest", newValue),
                            onInputChange: (event: React.SyntheticEvent, value: string) => {
                              setValue("guest_name", value, { shouldDirty: true, shouldTouch: true });
                            }
                          }}
                          textFieldProps={{
                            fullWidth: true,
                            margin: margin,
                            variant: variant,
                            helperText: errors.guest_name && t("Guest name is required"),
                            InputProps: {
                              // endAdornment: null,
                              startAdornment: <ContactsIcon />
                            }
                          }}
                        />
                      </Grid>
                      <Grid item sm={6} xs={12}>
                        <TextFieldElement
                          control={control}
                          name="guest_contact"
                          label={t("Phone / email")}
                          fullWidth
                          margin={margin}
                          variant={variant}
                          multiline
                          rows={2}
                        />
                      </Grid>
                      <Grid item sm={6} xs={12}>
                        <TextFieldElement
                          control={control}
                          name="guest_address"
                          label={t("Address")}
                          fullWidth
                          margin={margin}
                          variant={variant}
                          multiline
                          rows={2}
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
                      {/* Dates */}
                      <Grid item xs={12}>
                        <Grid container spacing={1} justifyContent="space-around" alignItems="center">
                          <Grid item sm={5} xs={12}>
                            <DatePickerElement
                              control={control}
                              name="begin_date"
                              label={t("Arrival")}
                              onChange={(date) => onDateChange(date, "begin_date")}
                            />
                          </Grid>
                          <Hidden smDown>
                            <Grid item sm={2} xs={12} style={{ "textAlign": "center" }}>
                              <ForwardIcon />
                            </Grid>
                          </Hidden>
                          <Grid item sm={5} xs={12}>
                            <DatePickerElement
                              control={control}
                              name="end_date"
                              label={t("Departure")}
                              onChange={(date) => onDateChange(date, "end_date")}
                            />
                          </Grid>
                        </Grid>
                      </Grid>
                      {/* Price */}
                      <Grid
                        item container xs={12}
                        spacing={1} alignItems="center"
                        justifyContent={!isFlatRate ? "space-around" : "flex-start"}
                      >
                        <Grid item sm={isFlatRate ? 5 : 7} xs={isFlatRate ? 5 : 12} className="flex-box-stretched">
                          <SelectElement
                            control={control}
                            name="duration"
                            label={t("Nights")}
                            variant={variant}
                            margin={margin}
                            type="number"
                            sx={{ width: "4em" }}
                            onChange={(value) => handleChange("duration", Number(value))}
                            options={[
                              ...Array.from({ length: 31 }, (v, k) => k + 1).map(n => ({
                                id: n,
                                label: n
                              })),
                              ...(duration > 31 ? [{ id: duration, label: duration }] : [])
                            ]}
                          />
                          {!isFlatRate &&
                            <>
                              <span>&nbsp;x&nbsp;</span>
                              <TextFieldElement
                                control={control}
                                name={"daily_rate"}
                                label={t("Daily rate")}
                                className="price-input"
                                type={"number"}
                                required
                                validation={{
                                  min: { value: 0, message: t("Rate can't be negative") },
                                  validate: { validateNumber: (v) => (typeof v !== "undefined") }
                                }}
                                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                                margin={margin}
                                variant={variant}
                                onChange={event => handleChange(event.target.name, event.target.value)}
                              />
                            </>}
                          <div className="spacer" />
                          =
                          <div className="spacer" />
                        </Grid>
                        <Grid item sm={isFlatRate ? 7 : 5} xs={isFlatRate ? 7 : 12} className="flex-box-align-left">
                          <TextFieldElement
                            control={control}
                            name={"price"}
                            label={t("Total")}
                            className="price-input"
                            type={"number"}
                            required
                            validation={{
                              min: { value: 0, message: t("Price can't be negative") },
                              validate: { validateNumber: (v) => (typeof v !== "undefined") }
                            }}
                            InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                            margin={margin}
                            variant={variant}
                            onChange={event => handleChange(event.target.name, event.target.value)}
                          />
                          <div className="spacer" />
                          <CheckboxElement
                            control={control}
                            name="is_flat_rate"
                            label={t("Flat rate")}
                            labelProps={{
                              labelPlacement: "start"
                            }}
                            onChange={event => handleChange(event.target.name, event.target.checked)}
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
                            validate: { validateNumber: (v) => (typeof v !== "undefined") }
                          }}
                          InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                          margin={margin}
                          variant={variant}
                        />
                        <div className="spacer" />
                        <Typography>
                          {fullPrice ? t("Balance: {{amount}}", { amount: formatCurrency(fullPrice - (deposit ?? 0)) }) : ""}
                        </Typography>
                      </Grid>
                      { /* commission fees and taxes */}
                      <Grid item xs={12} className="flex-box-align-left">
                        <TextFieldElement
                          control={control}
                          name={"commission_fees"}
                          label={t("Commission fees")}
                          sx={{ width: "10em;" }}
                          type={"number"}
                          // required
                          validation={{
                            min: { value: 0, message: t("Commission fees can't be negative") },
                            validate: { validateNumber: (v) => (typeof v !== "undefined") }
                          }}
                          InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                          margin={margin}
                          variant={variant}
                        />
                        <div className="spacer" />
                        {customizeTouristTax ?
                          <>
                            <TextFieldElement
                              control={control}
                              name={"custom_tourist_tax"}
                              label={t("Tourist tax")}
                              sx={{ width: "10em;" }}
                              type={"number"}
                              validation={{
                                min: { value: 0, message: t("Tourist tax can't be negative") },
                                validate: { validateNumber: (v) => (typeof v !== "undefined") }
                              }}
                              InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                              margin={margin}
                              variant={variant}
                            />
                            <IconButton
                              type="button"
                              className="custom_tourist_tax-button"
                              color="error"
                              onClick={() => onCustomizeTouristTaxHandler()}
                              title={t("Reset")}
                            ><BackspaceIcon /></IconButton>
                          </>
                          :
                          <>
                            <Typography>
                              {touristTax ? t("Tourist tax: {{amount}}", { amount: formatCurrency(touristTax) }) : ""}
                            </Typography>
                            <IconButton
                              type="button"
                              className="custom_tourist_tax-button"
                              color="info"
                              onClick={() => onCustomizeTouristTaxHandler()}
                              title={t("Customize")}
                            ><EditIcon /></IconButton>
                          </>
                        }
                      </Grid>
                      {/* number of persons */}
                      <Grid item xs={12} className="flex-box-align-left">
                        <SelectElement
                          control={control}
                          name="adults"
                          label={t("Adults")}
                          variant={variant}
                          margin={margin}
                          type="number"
                          sx={{ width: "4em" }}
                          options={[...Array(10).keys()].map(n => ({ id: n, label: n }))}
                          onChange={(value) => handleChange("adults", value)}
                        />
                        <div className="spacer" />
                        <SelectElement
                          control={control}
                          name="children"
                          label={t("Children")}
                          variant={variant}
                          margin={margin}
                          type="number"
                          sx={{ width: "4em" }}
                          options={[...Array(10).keys()].map(n => ({ id: n, label: n }))}
                          onChange={(value) => handleChange("children", value)}
                        />
                        <div className="spacer" />
                        <SelectElement
                          control={control}
                          name="babies"
                          label={t("Babies")}
                          variant={variant}
                          margin={margin}
                          type="number"
                          sx={{ width: "4em" }}
                          options={[...Array(10).keys()].map(n => ({ id: n, label: n }))}
                          onChange={(value) => handleChange("babies", value)}
                        />
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
                          <OptionsList
                            form={formContext} duration={duration} allOptions={allOptions}
                            variant={variant}
                          />}
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
                        {bookingChannels &&
                          <SelectElement
                            control={control}
                            name="source_id"
                            label={t("Statistics")}
                            className="full-width"
                            variant={variant}
                            margin={margin}
                            type="number"
                            sx={{ width: "4em" }}
                            options={[
                              { id: undefined, label: "" },
                              ...bookingChannels.map(channel => ({ id: channel.id, label: channel.name }))
                            ]}
                          />}
                      </Grid>
                      {/* arrival_details */}
                      <Grid item xs={12}>
                        <TextFieldElement
                          control={control}
                          name={"arrival_details"}
                          label={t("Arrival details")}
                          margin={margin}
                          variant={variant}
                          fullWidth
                        />
                      </Grid>
                      {/* notes */}
                      <Grid item xs={12}>
                        <TextFieldElement
                          control={control}
                          name={"notes"}
                          label={t("Further information")}
                          margin={margin}
                          variant={variant}
                          fullWidth
                          multiline
                          rows={4}
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
                        bookingId={booking.id} onPaymentsUpdate={(total) => setTotalPayment(total)}
                      />
                    </AccordionDetails>
                  </Accordion>
                </Grid>}
            </Grid>
          </FormContainer>
        }
      </DialogContent>
      {!fullScreen &&
        <DialogActions>
          <Stack direction="row" justifyContent={"flex-end"}>
            <Button type="button" onClick={onCloseHandler}>{t("Close")}</Button>
            <BookingActions
              booking={booking} isDirty={isDirty} onReset={reset}
              onSave={handleSave}
              onCancelBooking={onCancelBooking} onUncancelBooking={onUncancelBooking}
              onOpenContract={onOpenContract}
            />
            {width < 1100 && <div style={{ width: "50px" }} />}
          </Stack>
        </DialogActions>}
    </Dialog>
  );
};

export default BookingDialog;
