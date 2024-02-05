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
  Stack, Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow, Tabs,
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
import { Account, Booking, BookingStatus, Lodging, Service, User } from "../../types";
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
import MultiSelectElement from "../Fields/MultiSelectElement";
import { useAppSelector } from "../../app/hooks";
import Paper from "@mui/material/Paper";
import Comments from "../Comments";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import PeopleIcon from "@mui/icons-material/PeopleOutlined";
import CommentIcon from "@mui/icons-material/Comment";
import PaymentOutlinedIcon from "@mui/icons-material/PaymentOutlined";
import Box from "@mui/material/Box";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ width: "100%" }}
      {...other}
    >
      {value === index && (
        <Box sx={{ paddingTop: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

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
  const account = useAppSelector(store => store.auth.account) as Account;
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { showError, showSuccess } = useAlert();
  const { data: bookingChannels } = useListBookingChannelsQuery();
  const [createBooking] = useCreateBookingMutation();
  const [updateBooking] = useUpdateBookingMutation();
  const [totalPayment, setTotalPayment] = useState(Number(booking.total_payments));
  const variant = "outlined";
  const margin = "none";
  const bookingStatuses = getBookingStatuses();
  const [customizeTouristTax, setCustomizeTouristTax] = useState(typeof booking.custom_tourist_tax !== "undefined");
  const [showTitle, setShowTitle] = useState(true);
  const hasGroupedBooking = account.current_plan.grouped_bookings;
  const [selectedTab, setSelectedTab] = useState(0);

  // console.debug("booking", booking);
  console.assert(!!booking, "Booking not initialized");

  const setMultipleValues = (object: Partial<Booking>) => Object.keys(object).forEach(function(key) {
    setValue(key as any, (object as any)[key]);
  });

  let lodging: Lodging = booking.lodgings[0];  // first lodging for defaults values like taxes

  const defaultDistribution = { adults: 2, children: 0, babies: 0 };
  const initialState = initializeDefaults(booking);

  const formContext = useForm<Booking>({
    defaultValues: initialState
  });
  const { register, control, setValue, getValues, watch, formState, reset, setError, clearErrors } = formContext;
  const { errors, isDirty /*isValid*/ } = formState;
  const { dirtyFields } = useFormState({
    control
  });

  // console.log("ERRORS", errors);
  // console.log("isDirty: ", isDirty, dirtyFields);
  // console.log("defaultValues: ", initialState);
  // console.log("values: ", getValues());
  // console.log("DIFF", deepDiff(initialState, getValues()));

  usePageUnloadAlert(Object.keys(dirtyFields).length > 0);
  const unsavedChangesConfirm = useUnsavedChangesConfirm();

  const formValues = getValues();
  // console.debug("formValues: ", formValues);

  const lodging_ids = watch("lodging_ids", initialState.lodging_ids);
  const deposit = watch("deposit", initialState.deposit);
  const isFlatRate = watch("is_flat_rate", initialState.is_flat_rate);
  const duration = watch("duration", initialState.duration);
  const price = watch("price", initialState.price);
  const commissionFees = watch("commission_fees", initialState.commission_fees);
  const touristTax = watch("tourist_tax", computeTouristTax(initialState));
  const options = watch("options");
  const [includedInPriceOptions, excludedFromPriceOptions] = computeOptionsPrice(options, duration);
  // const fullPrice = watch("fullPrice", Number(price) + includedInPriceOptions);
  const fullPrice = Number(price) + includedInPriceOptions;
  const leftToPay = fullPrice + (lodging.tourist_tax_included_in_payment ? touristTax : 0) - totalPayment - (commissionFees ?? 0);
  // console.log("options", options, fullPrice);
  const guestsDistribution = watch("guests_distribution", {});

  const depositLabel = user ? getDepositLabel(t, lodging.deposit_label) : t("Deposit");
  const selectedLodgings = lodgings.filter(x => lodging_ids.includes(x.id));

  function initializeDefaults(booking: Booking) {
    const initialLodgings = lodgings.filter(x => booking.lodging_ids.includes(x.id));
    lodging = booking.lodging_ids ? initialLodgings[0] : lodgings[0];

    // Only include editable fields because to make `isDirty` reseted to false working after a submit
    // ==> dirty state is computed comparing default values and stored values (output of getValues())
    let {
      lodgings: _,
      price_with_options,
      left_to_pay,
      modified,
      computed_tourist_tax,
      guests,
      ...initialState
    }: Booking = booking;

    // Provide defaults for new bookings
    initialState.id = booking.id || "" as any;  // just to have an "undirty" state on new booking
    initialState.status = booking.status || BookingStatus.NotAvailable.name;
    initialState.lodging_ids = booking.lodging_ids || ([] as any);
    initialState.guest_name = booking.guest_name || "";
    initialState.guest_contact = booking.guest_contact || "";
    initialState.guest_address = booking.guest_address || "";
    initialState.begin_date = booking.begin_date || new Date();
    initialState.end_date = booking.end_date || addDays(initialState.begin_date, initialState.duration || 7);
    initialState.duration = booking.duration || differenceInCalendarDays(initialState.end_date, initialState.begin_date);
    initialState.daily_rate = booking.daily_rate || initialLodgings.reduce((accumulator, l) => accumulator + l.daily_rate, 0);
    initialState.is_flat_rate = booking.is_flat_rate || false;
    if (initialState.price === undefined)
      Object.assign(initialState, computeBookingPrice(initialState.begin_date, initialState.end_date,
        initialState.daily_rate, 0, 0, [], lodging.deposit_percent).price);
    initialState.guaranty = booking.guaranty || lodging.guaranty;
    initialState.commission_fees = booking.commission_fees || 0;
    initialState.is_flat_rate_tourist_tax = booking.is_flat_rate_tourist_tax ?? lodging.is_flat_rate_tourist_tax;
    initialState.tourist_tax_included_in_payment = booking.tourist_tax_included_in_payment ?? lodging.tourist_tax_included_in_payment;
    initialState.max_daily_tourist_tax = booking.max_daily_tourist_tax ?? (lodging.max_daily_tourist_tax || 0);
    initialState.tourist_tax_rate = booking.tourist_tax_rate ?? (lodging.tourist_tax_rate || 0);
    initialState.guests_distribution = booking.guests_distribution ?? {
      [lodging.id]: defaultDistribution
    };
    initialState.adults = booking.adults || defaultDistribution.adults;
    initialState.children = booking.children || defaultDistribution.children;
    initialState.babies = booking.babies || defaultDistribution.babies;
    initialState.source_id = booking.source_id || ("" as any);
    initialState.options = booking.options || (!booking.id ? allOptions.filter((o: Service) => lodging.default_services.includes(o.reference)) : []);
    initialState.arrival_details = booking.arrival_details ?? "";
    initialState.departure_details = booking.departure_details ?? "";
    initialState.notes = booking.notes ?? "";

    // console.debug("initialState", initialState);
    return initialState;
  }

  function updateTouristTax() {
    if (typeof lodging !== "undefined") {
      setValue("is_flat_rate_tourist_tax", lodging.is_flat_rate_tourist_tax);
      setValue("tourist_tax_included_in_payment", lodging.tourist_tax_included_in_payment);
      setValue("max_daily_tourist_tax", lodging.max_daily_tourist_tax);
      setValue("tourist_tax_rate", lodging.tourist_tax_rate);
    }
    const value = computeTouristTax(getValues());
    setValue("tourist_tax", value);
  }

  function computeTouristTax(values: Pick<Booking, "adults" | "children" | "babies" | "price" | "duration" | "max_daily_tourist_tax" | "is_flat_rate_tourist_tax" | "tourist_tax_rate">) {
    // console.log("computeTouristTax", filterObject(values, (v, k) => ["adults", "children", "babies", "price", "duration", "max_daily_tourist_tax"].includes(k)));
    // console.log("computeTouristTax", filterObject(values, (v, k) => ["max_daily_tourist_tax", "is_flat_rate_tourist_tax", "tourist_tax_rate"].includes(k)));
    let daily_rate = values.max_daily_tourist_tax ?? 0;
    if (!values.is_flat_rate_tourist_tax) {
      if (values.adults + values.children + values.babies > 0) {

        daily_rate = Math.round(values.price!
            / values.duration
            / (values.adults + values.children + values.babies)
            * (values.tourist_tax_rate ?? 0))
          / 100;

        daily_rate = Math.min(daily_rate, values.max_daily_tourist_tax ?? 0);
      } else
        daily_rate = 0;
    }
    return daily_rate * values.duration * values.adults;
  }

  /**
   * Handle values AFTER validation. This fonction can't change the type or the value, except using setValue().
   * @param fieldName
   * @param value
   */
  function handleChange(fieldName: string, value: string | number | boolean) {
    // console.log("VALUE", fieldName, value, typeof value, parseFloat(value as string), Number(value));
    switch (fieldName) {
      case "status_id": {
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
        updateTouristTax();
        return duration;
      }
      case "daily_rate":
        value = parseFloat(value as string);
        if (!isNaN(value)) {
          const { price: priceObj } = computeBookingPrice(formValues.begin_date, formValues.end_date, value, 0, 0, [], lodging.deposit_percent);
          setMultipleValues(priceObj);
          updateTouristTax();
        }
        break;
      case "price":
        value = parseFloat(value as string);
        if (!isNaN(value)) {
          setValue("daily_rate", DecimalPrecision.round(value / getValues().duration));
          setValue("price", value);
          setValue("is_flat_rate", true);
          updateTouristTax();
        }
        break;
      case "is_flat_rate":
        if (value)
          return true;
        else {
          const formValues = getValues();
          const { price: priceObj } = computeBookingPrice(formValues.begin_date, formValues.end_date,
            formValues.daily_rate ?? lodging.daily_rate, 0, 0, [], lodging.deposit_percent);
          setMultipleValues(priceObj);
          updateTouristTax();
          return false;
        }
      case "adults":
      case "children":
      case "babies":
        updateTouristTax();
        return value;
      default:
        console.warn("Unhandled input:", fieldName);
        return value;
    }
  }

  function handleLodgingsChange(value: number[] | number | string) {
    // console.log("handleLodgingsChange", value);
    const ids = typeof value === "string"
      ? value.split(",").map(Number)
      : typeof value === "number" ? [value] : value;
    if (ids.length === 0) {
      setError("lodging_ids", { type: "required", message: t("At least one lodging should be selected") });
      return ids;
    } else if (errors.lodging_ids?.type === "required") {
      clearErrors("lodging_ids");
    }
    if (typeof value === "number") { // SelectElement case
      setValue("lodging_ids", ids, { shouldDirty: true });
    }
    const formValues = getValues();
    lodging = lodgings.filter(x => ids.includes(x.id))[0];
    const daily_rate = lodgings.filter(x => ids.includes(x.id)).reduce((pValue, lodging) => pValue + lodging.daily_rate, 0);
    if (!isFlatRate && formValues.daily_rate !== daily_rate) {
      const { price: priceObj } = computeBookingPrice(formValues.begin_date, formValues.end_date, daily_rate, 0, 0, [], lodging.deposit_percent);
      setMultipleValues(priceObj);
    }

    const newDistribution = ids.reduce((d, id) => {
      return {
        ...d,
        [id]: (guestsDistribution && guestsDistribution[id]) ?? defaultDistribution
      };
    }, {});
    setValue("guests_distribution", newDistribution, { shouldDirty: true });
    ["adults", "children", "babies"].forEach((fieldName) =>
      // @ts-ignore
      setValue(fieldName as any, ids.reduce((acc, id) => acc + ((newDistribution[id] && newDistribution[id][fieldName]) ?? 0), 0))
    );

    updateTouristTax();
  }

  function handleDistributionChange(lodging: Lodging, fieldName: "adults" | "children" | "babies", value: number) {
    // let newDistribution = structuredClone(guestsDistribution);
    // if (!newDistribution)
    //   newDistribution = {};
    if (!guestsDistribution[lodging.id]) {
      guestsDistribution[lodging.id] = defaultDistribution;
    }
    guestsDistribution[lodging.id][fieldName] = value;
    setValue("guests_distribution", guestsDistribution, { shouldDirty: true });
    setValue(fieldName, lodging_ids.reduce((acc, id) => acc + ((guestsDistribution[id] && guestsDistribution[id][fieldName]) ?? 0), 0));
    updateTouristTax();
  }

  function onDurationChange(newValue: number) {
    const formValues = getValues();
    const duration = Number(newValue);
    const endDate = addDays(formValues.begin_date, duration);
    const priceObj = formValues.is_flat_rate ? { daily_rate: (formValues.price ?? 0) / duration }
      : computeBookingPrice(formValues.begin_date, endDate, formValues.daily_rate ?? lodging.daily_rate, 0, 0, [], lodging.deposit_percent).price;
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
      : computeBookingPrice(newBooking.begin_date, newBooking.end_date, formValues.daily_rate ?? lodging.daily_rate, 0, 0, [], lodging.deposit_percent).price;
    setMultipleValues(priceObj);
    setValue("duration", duration);
    updateTouristTax();
    return newBooking[fieldName];
  }

  function handleSave(closeDialog: boolean) {
    return new Promise<Booking>((resolve) => {
      formContext.handleSubmit(
        async (data: Booking) => await saveBooking(data).then((booking) => {
          resolve(booking);
          closeDialog && onClose();
        }))();
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
    setCustomizeTouristTax(!customizeTouristTax);
    if (customizeTouristTax) {
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
      maxWidth={width < 1200 ? "md" : "md"}
      fullWidth
      fullScreen={fullScreen}
    >
      {fullScreen &&
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
              onDelete={() => onClose()}
              onOpenContract={onOpenContract}
              onConfirmCancellation={(confirm) => setShowTitle(!confirm)}
              primaryColor="inherit"
            />
          </Toolbar>
        </AppBar>
        // :
        // <DialogTitle id="simple-dialog-title">
        //   <Grid justifyContent="space-between" container spacing={4}>
        //     <Grid item xs={6}>
        //       {dialogTitle}
        //     </Grid>
        //     <Grid item xs={6} className="total-wrapper">
        //       <span className="total-price">
        //         {t("total = {{ fullPrice }}", { fullPrice: formatCurrency(fullPrice) })}</span>
        //       {(excludedFromPriceOptions) > 0 && (
        //         <span
        //           className="third-party-price"
        //         ><br />(+ {formatCurrency(excludedFromPriceOptions)} {t("for third party services")})</span>)
        //       }
        //     </Grid>
        //   </Grid>
        // </DialogTitle>
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
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={selectedTab} onChange={(_, value) => setSelectedTab(value)} aria-label="booking dialog"
                variant={fullScreen ? "fullWidth" : "standard"}
              >
                <Tab icon={<InfoOutlinedIcon />} aria-label="info" />
                <Tab icon={<PeopleIcon />} aria-label="contact" />
                <Tab icon={<RoomServiceIcon />} aria-label="options" />
                {booking.id && <Tab icon={<PaymentOutlinedIcon />} aria-label="payments" />}
                {booking.id && <Tab icon={<CommentIcon />} aria-label="comments" />}
              </Tabs>
            </Box>

            <CustomTabPanel value={selectedTab} index={0}>
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
                  {lodgings && (
                    hasGroupedBooking ?
                      <MultiSelectElement
                        control={control}
                        name="lodging_ids"
                        label={t("Lodging")}
                        className="full-width"
                        margin={margin}
                        fullWidth
                        required
                        variant={variant}
                        options={lodgings.map(lodging => (
                          { id: lodging.id, label: lodging.name }
                        ))}
                        onChange={(event) => handleLodgingsChange(event.target.value)}
                      />
                      :
                      <SelectElement
                        control={control}
                        name="lodging_ids"
                        label={t("Lodging")}
                        className="full-width"
                        margin={margin}
                        fullWidth
                        variant={variant}
                        options={lodgings.map(lodging => (
                          { id: lodging.id, label: lodging.name }
                        ))}
                        onChange={(value) => handleLodgingsChange(value)}
                      />)
                  }
                </Grid>
                {/* Dates */}
                <Grid item xs={12}>
                  <Grid container spacing={1} justifyContent="space-around" alignItems="center">
                    <Grid item sm={5} xs={12}>
                      <DatePickerElement
                        control={control}
                        name="begin_date"
                        label={t("Arrival")}
                        onChange={(date) => onDateChange(date, "begin_date")}
                        inputProps={{ size: "small" }}
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
                        inputProps={{ size: "small" }}
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
                      size="small"
                      type="number"
                      sx={{ width: "6em" }}
                      onChange={(value) => handleChange("duration", Number(value))}
                      options={[
                        ...Array.from({ length: 31 }, (_, k) => k + 1).map(n => ({
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
                          size="small"
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
                      size="small"
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
                    size="small"
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
                    size="small"
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
                        size="small"
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
                        {t("Tourist tax: {{amount}}", { amount: formatCurrency(touristTax ?? 0) })}
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
              </Grid>
            </CustomTabPanel>
            <CustomTabPanel value={selectedTab} index={1}>
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
                      onChange: (_: any, newValue: string) => handleChange("existing-guest", newValue),
                      onInputChange: (_: React.SyntheticEvent, value: string) => {
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
                {/* number of persons */}
                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table size="small" aria-label="a dense table">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t("Number of occupants")}</TableCell>
                          <TableCell align="right">{t("Adults")}</TableCell>
                          <TableCell align="right">{t("Children")}</TableCell>
                          <TableCell align="right">{t("Babies")}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {
                          selectedLodgings.map(l =>
                            <TableRow key={l.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                              <TableCell component="th" scope="row">
                                {l.name}
                              </TableCell>
                              {[["adults", t("Adults")], ["children", t("Children")], ["babies", t("Babies")]].map(([name, _]) =>
                                <TableCell key={name} align="right">
                                  <FormControl fullWidth>
                                    {/*<InputLabel id={`${l.id}-${label}`}>{label}</InputLabel>*/}
                                    <Select
                                      variant="standard"
                                      size="small"
                                      margin={margin}
                                      type="number"
                                      // sx={{ width: "5em" }}
                                      value={(guestsDistribution && guestsDistribution[l.id] && guestsDistribution[l.id][name as "adults" | "children" | "babies"]) ?? 0}
                                      onChange={(event) => handleDistributionChange(l, name as any, event.target.value as number)}
                                    >
                                      {[...Array(10).keys()].map(n =>
                                        <MenuItem
                                          key={n} sx={{ textAlign: "right" }} value={n}
                                        >{n}</MenuItem>)}
                                    </Select>
                                  </FormControl>
                                </TableCell>)}
                            </TableRow>
                          )
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>

                </Grid>
              </Grid>
            </CustomTabPanel>
            <CustomTabPanel value={selectedTab} index={2}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="h5">{t("Options")}</Typography>
                </Grid>
                <Grid item xs={12}>
                  {allOptions &&
                    <OptionsList
                      form={formContext} duration={duration} allOptions={allOptions}
                      variant={variant}
                    />}
                </Grid>
              </Grid>
            </CustomTabPanel>
            <CustomTabPanel value={selectedTab} index={3}>
              {booking.id && <>
                <Typography variant="body1" sx={{fontStyle: "italic"}}>
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
                <Payments
                  bookingId={booking.id} onPaymentsUpdate={(total) => setTotalPayment(total)}
                />
              </>}
            </CustomTabPanel>
            <CustomTabPanel value={selectedTab} index={4}>
              {booking.id && <Comments booking={booking} />}
            </CustomTabPanel>

            {/*<Grid container spacing={1}>*/}
            {/*  { /* BOOKING STATUS *!/*/}
            {/*  <Grid item sm={4} xs={12}>*/}
            {/*    <FormControl className="full-width" variant={variant}>*/}
            {/*      <InputLabel id="status-label">{t("Booking status")}</InputLabel>*/}
            {/*      <Controller*/}
            {/*        name="status"*/}
            {/*        control={control}*/}
            {/*        render={({ field }) =>*/}
            {/*          <Select*/}
            {/*            labelId="status-label"*/}
            {/*            margin={margin}*/}
            {/*            label={t("Booking status")}*/}
            {/*            className="booking-status-select"*/}
            {/*            {...field}*/}
            {/*          >*/}
            {/*            {bookingStatuses.map(status => (*/}
            {/*              <MenuItem key={status.name} value={status.name}>*/}
            {/*                <span*/}
            {/*                  className="booking-status-item"*/}
            {/*                  style={{ background: status.color }}*/}
            {/*                >{status.getLabel(t)}</span>*/}
            {/*              </MenuItem>*/}
            {/*            ))}*/}
            {/*          </Select>}*/}
            {/*      />*/}
            {/*    </FormControl>*/}
            {/*  </Grid>*/}
            {/*  { /* LODGING *!/*/}
            {/*  <Grid item sm={8} xs={12}>*/}
            {/*    {lodgings && (*/}
            {/*      hasGroupedBooking ?*/}
            {/*        <MultiSelectElement*/}
            {/*          control={control}*/}
            {/*          name="lodging_ids"*/}
            {/*          label={t("Lodging")}*/}
            {/*          className="full-width"*/}
            {/*          margin={margin}*/}
            {/*          fullWidth*/}
            {/*          required*/}
            {/*          variant={variant}*/}
            {/*          options={lodgings.map(lodging => (*/}
            {/*            { id: lodging.id, label: lodging.name }*/}
            {/*          ))}*/}
            {/*          onChange={(event) => handleLodgingsChange(event.target.value)}*/}
            {/*        />*/}
            {/*        :*/}
            {/*        <SelectElement*/}
            {/*          control={control}*/}
            {/*          name="lodging_ids"*/}
            {/*          label={t("Lodging")}*/}
            {/*          className="full-width"*/}
            {/*          margin={margin}*/}
            {/*          fullWidth*/}
            {/*          variant={variant}*/}
            {/*          options={lodgings.map(lodging => (*/}
            {/*            { id: lodging.id, label: lodging.name }*/}
            {/*          ))}*/}
            {/*          onChange={(value) => handleLodgingsChange(value)}*/}
            {/*        />)*/}
            {/*    }*/}
            {/*  </Grid>*/}
            {/*  { /* GUEST *!/*/}
            {/*  <Grid item lg={6} xs={12}>*/}
            {/*    <Accordion defaultExpanded>*/}
            {/*      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="guest-header">*/}
            {/*        <Typography gutterBottom className="accordion-heading">{t("Guest")}</Typography>*/}
            {/*      </AccordionSummary>*/}
            {/*      <AccordionDetails>*/}
            {/*        <Grid container spacing={1}>*/}
            {/*          <Grid item xs={12}>*/}
            {/*            <AutocompleteElement*/}
            {/*              control={control}*/}
            {/*              name="guest_name"*/}
            {/*              label={t("Full guest name")}*/}
            {/*              rules={{ required: true }}*/}
            {/*              options={allGuests.map((g) => g.name)}*/}
            {/*              autocompleteProps={{*/}
            {/*                freeSolo: true,*/}
            {/*                onChange: (_: any, newValue: string) => handleChange("existing-guest", newValue),*/}
            {/*                onInputChange: (_: React.SyntheticEvent, value: string) => {*/}
            {/*                  setValue("guest_name", value, { shouldDirty: true, shouldTouch: true });*/}
            {/*                }*/}
            {/*              }}*/}
            {/*              textFieldProps={{*/}
            {/*                fullWidth: true,*/}
            {/*                margin: margin,*/}
            {/*                variant: variant,*/}
            {/*                helperText: errors.guest_name && t("Guest name is required"),*/}
            {/*                InputProps: {*/}
            {/*                  // endAdornment: null,*/}
            {/*                  startAdornment: <ContactsIcon />*/}
            {/*                }*/}
            {/*              }}*/}
            {/*            />*/}
            {/*          </Grid>*/}
            {/*          <Grid item sm={6} xs={12}>*/}
            {/*            <TextFieldElement*/}
            {/*              control={control}*/}
            {/*              name="guest_contact"*/}
            {/*              label={t("Phone / email")}*/}
            {/*              fullWidth*/}
            {/*              margin={margin}*/}
            {/*              variant={variant}*/}
            {/*              multiline*/}
            {/*              rows={2}*/}
            {/*            />*/}
            {/*          </Grid>*/}
            {/*          <Grid item sm={6} xs={12}>*/}
            {/*            <TextFieldElement*/}
            {/*              control={control}*/}
            {/*              name="guest_address"*/}
            {/*              label={t("Address")}*/}
            {/*              fullWidth*/}
            {/*              margin={margin}*/}
            {/*              variant={variant}*/}
            {/*              multiline*/}
            {/*              rows={2}*/}
            {/*            />*/}
            {/*          </Grid>*/}
            {/*        </Grid>*/}
            {/*      </AccordionDetails>*/}
            {/*    </Accordion>*/}
            {/*  </Grid>*/}
            {/*  { /* BOOKING DETAILS *!/*/}
            {/*  <Grid item lg={6} xs={12}>*/}
            {/*    <Accordion defaultExpanded>*/}
            {/*      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1a-content" id="booking-header">*/}
            {/*        <Typography gutterBottom className="accordion-heading">{t("Booking details")}</Typography>*/}
            {/*      </AccordionSummary>*/}
            {/*      <AccordionDetails>*/}
            {/*        <Grid container spacing={1}>*/}
            {/*          /!* Dates *!/*/}
            {/*          <Grid item xs={12}>*/}
            {/*            <Grid container spacing={1} justifyContent="space-around" alignItems="center">*/}
            {/*              <Grid item sm={5} xs={12}>*/}
            {/*                <DatePickerElement*/}
            {/*                  control={control}*/}
            {/*                  name="begin_date"*/}
            {/*                  label={t("Arrival")}*/}
            {/*                  onChange={(date) => onDateChange(date, "begin_date")}*/}
            {/*                  inputProps={{ size: "small" }}*/}
            {/*                />*/}
            {/*              </Grid>*/}
            {/*              <Hidden smDown>*/}
            {/*                <Grid item sm={2} xs={12} style={{ "textAlign": "center" }}>*/}
            {/*                  <ForwardIcon />*/}
            {/*                </Grid>*/}
            {/*              </Hidden>*/}
            {/*              <Grid item sm={5} xs={12}>*/}
            {/*                <DatePickerElement*/}
            {/*                  control={control}*/}
            {/*                  name="end_date"*/}
            {/*                  label={t("Departure")}*/}
            {/*                  onChange={(date) => onDateChange(date, "end_date")}*/}
            {/*                  inputProps={{ size: "small" }}*/}
            {/*                />*/}
            {/*              </Grid>*/}
            {/*            </Grid>*/}
            {/*          </Grid>*/}
            {/*          /!* Price *!/*/}
            {/*          <Grid*/}
            {/*            item container xs={12}*/}
            {/*            spacing={1} alignItems="center"*/}
            {/*            justifyContent={!isFlatRate ? "space-around" : "flex-start"}*/}
            {/*          >*/}
            {/*            <Grid item sm={isFlatRate ? 5 : 7} xs={isFlatRate ? 5 : 12} className="flex-box-stretched">*/}
            {/*              <SelectElement*/}
            {/*                control={control}*/}
            {/*                name="duration"*/}
            {/*                label={t("Nights")}*/}
            {/*                variant={variant}*/}
            {/*                margin={margin}*/}
            {/*                size="small"*/}
            {/*                type="number"*/}
            {/*                sx={{ width: "6em" }}*/}
            {/*                onChange={(value) => handleChange("duration", Number(value))}*/}
            {/*                options={[*/}
            {/*                  ...Array.from({ length: 31 }, (_, k) => k + 1).map(n => ({*/}
            {/*                    id: n,*/}
            {/*                    label: n*/}
            {/*                  })),*/}
            {/*                  ...(duration > 31 ? [{ id: duration, label: duration }] : [])*/}
            {/*                ]}*/}
            {/*              />*/}
            {/*              {!isFlatRate &&*/}
            {/*                <>*/}
            {/*                  <span>&nbsp;x&nbsp;</span>*/}
            {/*                  <TextFieldElement*/}
            {/*                    control={control}*/}
            {/*                    name={"daily_rate"}*/}
            {/*                    label={t("Daily rate")}*/}
            {/*                    className="price-input"*/}
            {/*                    type={"number"}*/}
            {/*                    required*/}
            {/*                    validation={{*/}
            {/*                      min: { value: 0, message: t("Rate can't be negative") },*/}
            {/*                      validate: { validateNumber: (v) => (typeof v !== "undefined") }*/}
            {/*                    }}*/}
            {/*                    InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}*/}
            {/*                    margin={margin}*/}
            {/*                    size="small"*/}
            {/*                    variant={variant}*/}
            {/*                    onChange={event => handleChange(event.target.name, event.target.value)}*/}
            {/*                  />*/}
            {/*                </>}*/}
            {/*              <div className="spacer" />*/}
            {/*              =*/}
            {/*              <div className="spacer" />*/}
            {/*            </Grid>*/}
            {/*            <Grid item sm={isFlatRate ? 7 : 5} xs={isFlatRate ? 7 : 12} className="flex-box-align-left">*/}
            {/*              <TextFieldElement*/}
            {/*                control={control}*/}
            {/*                name={"price"}*/}
            {/*                label={t("Total")}*/}
            {/*                className="price-input"*/}
            {/*                type={"number"}*/}
            {/*                required*/}
            {/*                validation={{*/}
            {/*                  min: { value: 0, message: t("Price can't be negative") },*/}
            {/*                  validate: { validateNumber: (v) => (typeof v !== "undefined") }*/}
            {/*                }}*/}
            {/*                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}*/}
            {/*                margin={margin}*/}
            {/*                size="small"*/}
            {/*                variant={variant}*/}
            {/*                onChange={event => handleChange(event.target.name, event.target.value)}*/}
            {/*              />*/}
            {/*              <div className="spacer" />*/}
            {/*              <CheckboxElement*/}
            {/*                control={control}*/}
            {/*                name="is_flat_rate"*/}
            {/*                label={t("Flat rate")}*/}
            {/*                labelProps={{*/}
            {/*                  labelPlacement: "start"*/}
            {/*                }}*/}
            {/*                onChange={event => handleChange(event.target.name, event.target.checked)}*/}
            {/*              />*/}
            {/*            </Grid>*/}
            {/*          </Grid>*/}
            {/*          /!* Deposit *!/*/}
            {/*          <Grid item xs={12} className="flex-box-align-left">*/}
            {/*            <Typography>*/}
            {/*              {includedInPriceOptions ? t("Included options: {{amount}}", { amount: formatCurrency(includedInPriceOptions) }) : ""}*/}
            {/*            </Typography>*/}
            {/*          </Grid>*/}
            {/*          <Grid item xs={12} className="flex-box-align-left">*/}
            {/*            <TextFieldElement*/}
            {/*              control={control}*/}
            {/*              name={"deposit"}*/}
            {/*              label={depositLabel}*/}
            {/*              className="price-input"*/}
            {/*              type={"number"}*/}
            {/*              // required*/}
            {/*              validation={{*/}
            {/*                min: {*/}
            {/*                  value: 0,*/}
            {/*                  message: t("{{depositLabel}} can't be negative", { depositLabel: depositLabel })*/}
            {/*                },*/}
            {/*                max: {*/}
            {/*                  value: price ?? 0,*/}
            {/*                  message: t("{{depositLabel}} can't be higher than price", { depositLabel: depositLabel })*/}
            {/*                },*/}
            {/*                validate: { validateNumber: (v) => (typeof v !== "undefined") }*/}
            {/*              }}*/}
            {/*              InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}*/}
            {/*              margin={margin}*/}
            {/*              size="small"*/}
            {/*              variant={variant}*/}
            {/*            />*/}
            {/*            <div className="spacer" />*/}
            {/*            <Typography>*/}
            {/*              {fullPrice ? t("Balance: {{amount}}", { amount: formatCurrency(fullPrice - (deposit ?? 0)) }) : ""}*/}
            {/*            </Typography>*/}
            {/*          </Grid>*/}
            {/*          { /* commission fees and taxes *!/*/}
            {/*          <Grid item xs={12} className="flex-box-align-left">*/}
            {/*            <TextFieldElement*/}
            {/*              control={control}*/}
            {/*              name={"commission_fees"}*/}
            {/*              label={t("Commission fees")}*/}
            {/*              sx={{ width: "10em;" }}*/}
            {/*              type={"number"}*/}
            {/*              size="small"*/}
            {/*              // required*/}
            {/*              validation={{*/}
            {/*                min: { value: 0, message: t("Commission fees can't be negative") },*/}
            {/*                validate: { validateNumber: (v) => (typeof v !== "undefined") }*/}
            {/*              }}*/}
            {/*              InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}*/}
            {/*              margin={margin}*/}
            {/*              variant={variant}*/}
            {/*            />*/}
            {/*            <div className="spacer" />*/}
            {/*            {customizeTouristTax ?*/}
            {/*              <>*/}
            {/*                <TextFieldElement*/}
            {/*                  control={control}*/}
            {/*                  name={"custom_tourist_tax"}*/}
            {/*                  label={t("Tourist tax")}*/}
            {/*                  sx={{ width: "10em;" }}*/}
            {/*                  type={"number"}*/}
            {/*                  validation={{*/}
            {/*                    min: { value: 0, message: t("Tourist tax can't be negative") },*/}
            {/*                    validate: { validateNumber: (v) => (typeof v !== "undefined") }*/}
            {/*                  }}*/}
            {/*                  InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}*/}
            {/*                  margin={margin}*/}
            {/*                  size="small"*/}
            {/*                  variant={variant}*/}
            {/*                />*/}
            {/*                <IconButton*/}
            {/*                  type="button"*/}
            {/*                  className="custom_tourist_tax-button"*/}
            {/*                  color="error"*/}
            {/*                  onClick={() => onCustomizeTouristTaxHandler()}*/}
            {/*                  title={t("Reset")}*/}
            {/*                ><BackspaceIcon /></IconButton>*/}
            {/*              </>*/}
            {/*              :*/}
            {/*              <>*/}
            {/*                <Typography>*/}
            {/*                  {t("Tourist tax: {{amount}}", { amount: formatCurrency(touristTax ?? 0) })}*/}
            {/*                </Typography>*/}
            {/*                <IconButton*/}
            {/*                  type="button"*/}
            {/*                  className="custom_tourist_tax-button"*/}
            {/*                  color="info"*/}
            {/*                  onClick={() => onCustomizeTouristTaxHandler()}*/}
            {/*                  title={t("Customize")}*/}
            {/*                ><EditIcon /></IconButton>*/}
            {/*              </>*/}
            {/*            }*/}
            {/*          </Grid>*/}
            {/*          /!* number of persons *!/*/}
            {/*          <Grid item xs={12}>*/}
            {/*            <TableContainer component={Paper}>*/}
            {/*              <Table size="small" aria-label="a dense table">*/}
            {/*                <TableHead>*/}
            {/*                  <TableRow>*/}
            {/*                    <TableCell>{t("Number of occupants")}</TableCell>*/}
            {/*                    <TableCell align="right">{t("Adults")}</TableCell>*/}
            {/*                    <TableCell align="right">{t("Children")}</TableCell>*/}
            {/*                    <TableCell align="right">{t("Babies")}</TableCell>*/}
            {/*                  </TableRow>*/}
            {/*                </TableHead>*/}
            {/*                <TableBody>*/}
            {/*                  {*/}
            {/*                    selectedLodgings.map(l =>*/}
            {/*                      <TableRow key={l.id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>*/}
            {/*                        <TableCell component="th" scope="row">*/}
            {/*                          {l.name}*/}
            {/*                        </TableCell>*/}
            {/*                        {[["adults", t("Adults")], ["children", t("Children")], ["babies", t("Babies")]].map(([name, _]) =>*/}
            {/*                          <TableCell key={name} align="right">*/}
            {/*                            <FormControl fullWidth>*/}
            {/*                              /!*<InputLabel id={`${l.id}-${label}`}>{label}</InputLabel>*!/*/}
            {/*                              <Select*/}
            {/*                                variant="standard"*/}
            {/*                                size="small"*/}
            {/*                                margin={margin}*/}
            {/*                                type="number"*/}
            {/*                                // sx={{ width: "5em" }}*/}
            {/*                                value={(guestsDistribution && guestsDistribution[l.id] && guestsDistribution[l.id][name as "adults" | "children" | "babies"]) ?? 0}*/}
            {/*                                onChange={(event) => handleDistributionChange(l, name as any, event.target.value as number)}*/}
            {/*                              >*/}
            {/*                                {[...Array(10).keys()].map(n =>*/}
            {/*                                  <MenuItem*/}
            {/*                                    key={n} sx={{ textAlign: "right" }} value={n}*/}
            {/*                                  >{n}</MenuItem>)}*/}
            {/*                              </Select>*/}
            {/*                            </FormControl>*/}
            {/*                          </TableCell>)}*/}
            {/*                      </TableRow>*/}
            {/*                    )*/}
            {/*                  }*/}
            {/*                </TableBody>*/}
            {/*              </Table>*/}
            {/*            </TableContainer>*/}

            {/*          </Grid>*/}
            {/*        </Grid>*/}
            {/*      </AccordionDetails>*/}
            {/*    </Accordion>*/}
            {/*  </Grid>*/}

            {/*  { /* OPTIONS *!/*/}
            {/*  <Grid item lg={6} xs={12}>*/}
            {/*    <Accordion defaultExpanded>*/}
            {/*      <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="options-content" id="options-header">*/}
            {/*        <Typography gutterBottom className="accordion-heading">{t("Options")}</Typography>*/}
            {/*      </AccordionSummary>*/}
            {/*      <AccordionDetails>*/}
            {/*        <Grid container spacing={1}>*/}
            {/*          <Grid item xs={12}>*/}
            {/*            {allOptions &&*/}
            {/*              <OptionsList*/}
            {/*                form={formContext} duration={duration} allOptions={allOptions}*/}
            {/*                variant={variant}*/}
            {/*              />}*/}
            {/*          </Grid>*/}
            {/*        </Grid>*/}
            {/*      </AccordionDetails>*/}
            {/*    </Accordion>*/}
            {/*  </Grid>*/}

            {/*  { /* COMPLEMENTS *!/*/}
            {/*  <Grid item lg={6} xs={12}>*/}
            {/*    <Accordion defaultExpanded>*/}
            {/*      <AccordionSummary*/}
            {/*        expandIcon={<ExpandMoreIcon />} aria-controls="complements-content"*/}
            {/*        id="complements-header"*/}
            {/*      >*/}
            {/*        <Typography gutterBottom className="accordion-heading">{t("Complements")}</Typography>*/}
            {/*      </AccordionSummary>*/}
            {/*      <AccordionDetails>*/}
            {/*        <Grid container spacing={1}>*/}
            {/*          /!* statistics *!/*/}
            {/*          <Grid item xs={12}>*/}
            {/*            {bookingChannels &&*/}
            {/*              <SelectElement*/}
            {/*                control={control}*/}
            {/*                name="source_id"*/}
            {/*                label={t("Statistics")}*/}
            {/*                className="full-width"*/}
            {/*                variant={variant}*/}
            {/*                margin={margin}*/}
            {/*                type="number"*/}
            {/*                sx={{ width: "4em" }}*/}
            {/*                options={[*/}
            {/*                  { id: undefined, label: "" },*/}
            {/*                  ...bookingChannels.map(channel => ({ id: channel.id, label: channel.name }))*/}
            {/*                ]}*/}
            {/*              />}*/}
            {/*          </Grid>*/}
            {/*          /!* arrival_details *!/*/}
            {/*          <Grid item sm={6} xs={12}>*/}
            {/*            <TextFieldElement*/}
            {/*              control={control}*/}
            {/*              name={"arrival_details"}*/}
            {/*              label={t("Check-in info")}*/}
            {/*              margin={margin}*/}
            {/*              variant={variant}*/}
            {/*              fullWidth*/}
            {/*            />*/}
            {/*          </Grid>*/}
            {/*          <Grid item sm={6} xs={12}>*/}
            {/*            <TextFieldElement*/}
            {/*              control={control}*/}
            {/*              name={"departure_details"}*/}
            {/*              label={t("Check-out info")}*/}
            {/*              margin={margin}*/}
            {/*              variant={variant}*/}
            {/*              fullWidth*/}
            {/*            />*/}
            {/*          </Grid>*/}
            {/*          /!* notes *!/*/}
            {/*          <Grid item xs={12}>*/}
            {/*            <TextFieldElement*/}
            {/*              control={control}*/}
            {/*              name={"notes"}*/}
            {/*              label={t("Further information")}*/}
            {/*              margin={margin}*/}
            {/*              variant={variant}*/}
            {/*              fullWidth*/}
            {/*              multiline*/}
            {/*              rows={4}*/}
            {/*            />*/}
            {/*          </Grid>*/}
            {/*        </Grid>*/}
            {/*      </AccordionDetails>*/}
            {/*    </Accordion>*/}
            {/*  </Grid>*/}

            {/*  { /* PAYMENTS *!/*/}
            {/*  {booking.id &&*/}
            {/*    <Grid item lg={6} xs={12}>*/}
            {/*      <Accordion defaultExpanded>*/}
            {/*        <AccordionSummary*/}
            {/*          expandIcon={<ExpandMoreIcon />} aria-controls="complements-content"*/}
            {/*          id="complements-header"*/}
            {/*        >*/}
            {/*          <Typography gutterBottom className="accordion-heading">{t("Payments")}</Typography>*/}
            {/*          <Typography gutterBottom className="accordion-secondary-heading">*/}
            {/*            {leftToPay > 0 &&*/}
            {/*              <span*/}
            {/*                className="left-to-pay"*/}
            {/*              >{t("Left to pay: {{amount}}", { amount: formatCurrency(leftToPay) })}</span>}*/}
            {/*            {leftToPay < 0 &&*/}
            {/*              <span*/}
            {/*                className="too-perceived"*/}
            {/*              >{t("Too perceived: {{amount}}", { amount: formatCurrency(-leftToPay) })}</span>}*/}
            {/*            {leftToPay === 0 && t("Fully paid")}*/}
            {/*          </Typography>*/}
            {/*        </AccordionSummary>*/}
            {/*        <AccordionDetails>*/}
            {/*          <Payments*/}
            {/*            bookingId={booking.id} onPaymentsUpdate={(total) => setTotalPayment(total)}*/}
            {/*          />*/}
            {/*        </AccordionDetails>*/}
            {/*      </Accordion>*/}
            {/*    </Grid>}*/}

            {/*  { /* COMMENTS *!/*/}
            {/*  {booking.id &&*/}
            {/*    <Grid item lg={6} xs={12}>*/}
            {/*      <Accordion defaultExpanded>*/}
            {/*        <AccordionSummary*/}
            {/*          expandIcon={<ExpandMoreIcon />} aria-controls="comments"*/}
            {/*          id="comments-header"*/}
            {/*        >*/}
            {/*          <Typography gutterBottom className="accordion-heading">{t("Comments")}</Typography>*/}
            {/*        </AccordionSummary>*/}
            {/*        <AccordionDetails>*/}
            {/*          <Comments booking={booking} />*/}
            {/*        </AccordionDetails>*/}
            {/*      </Accordion>*/}
            {/*    </Grid>}*/}
            {/*</Grid>*/}
          </FormContainer>
        }
      </DialogContent>
      {!fullScreen &&
        <DialogActions>
          <Stack direction="row" justifyContent={"flex-end"}>
            <Button type="button" onClick={onCloseHandler} color="secondary">{t("Close")}</Button>
            <BookingActions
              booking={booking} isDirty={isDirty} onReset={reset}
              onSave={handleSave}
              onCancelBooking={onCancelBooking} onUncancelBooking={onUncancelBooking}
              onDelete={() => onClose()}
              onOpenContract={booking.id ? onOpenContract : undefined}
            />
            {width < 1360 && <div style={{ width: "50px" }} />}
          </Stack>
        </DialogActions>}
    </Dialog>
  );
};

export default BookingDialog;
