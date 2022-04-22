import React from "react";
import PropTypes from "prop-types";
import makeStyles from '@mui/styles/makeStyles';
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../common/intlUtils";
import { formatDate } from "../common/dateUtils";
import { parseISO } from "date-fns";
import { FieldArrayWithId } from "react-hook-form";
import { Booking, Lodging, Service } from "../types";

const useStyles = makeStyles((/*theme*/) => ({
  wrapper: {
    display: "grid",
    gridTemplateColumns: "1fr 3fr",
    gridRowGap: "0.5em",
    gridColumnGap: "1em",
  },
  label: {
    textAlign: "right",
  },
  value: {
  },
  importantValue: {
    fontWeight: "bold"
  },
  spacer: {
    width: '40px',
    display: 'inline-block',
  }
}));

type BookingQuickViewProps = {
  booking: Booking;
};

const BookingQuickView = (props: BookingQuickViewProps) => {
  const { booking } = props;
  const classes = useStyles();
  const { t } = useTranslation();

  const detectPhoneAndMail = (str: string) => {
    const s1 = str.replace(/([\w._-]+@[\w.-]+\.[\w-]+)/g, '<a href="mailto:$1">$1</a>');
    return s1.replace(/(([+][\s./0-9]*)?[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g, '<a href="tel:$1">$1</a>');
  }

  return (
    <div className={classes.wrapper}>
      <span className={classes.label}>{t("Status:")}</span>
      <span className={classes.value}>{booking.status.name}</span>
      <span className={classes.label}>{t("Guest:")}</span>
      <span className={classes.importantValue}>{booking.guest_name}</span>
      <span className={classes.label}>{t("Lodging:")}</span>
      <span className={classes.importantValue}>{booking.lodging ? booking.lodging.name : t("Cancellation / Waiting")}</span>
      <span className={classes.label}>{t("From:")}</span>
      <span className={classes.value}>{formatDate(parseISO(booking.begin_date), "PPPP")}</span>
      <span className={classes.label}>{t("To:")}</span>
      <span className={classes.value}>{formatDate(parseISO(booking.end_date), "PPPP")}</span>
      <span className={classes.label}>{t("Nights:")}</span>
      <span className={classes.value}>{booking.duration}</span>
      <span className={classes.label}>{t("Options:")}</span>
      { booking.options && <React.Fragment>
        <span className={classes.value}>{booking.options.map((option: Service, index: number) => (
          <li>{option.designation}</li>
        ))
        }</span>
      </React.Fragment>}
      <span className={classes.label}>{t("Price:")}</span>
      <span className={classes.value}>{formatCurrency(booking.price_with_options)}</span>
      { booking.left_to_pay > 0 && <React.Fragment>
        <span className={classes.label}>{t("Left to pay:")}</span>
        <span className={classes.importantValue}>{formatCurrency(booking.left_to_pay)}</span></React.Fragment>}
      { booking.left_to_pay < 0 && <React.Fragment>
        <span className={classes.label}>{t("Too perceived:")}</span>
        <span className={classes.value}>{formatCurrency(-booking.left_to_pay)}</span></React.Fragment>}
      <span className={classes.label}>{t("Adults:")}</span>
      <span className={classes.value}>{booking.adults}</span>
      {booking.children ? (<React.Fragment>
        <span className={classes.label}>{t("Children:")}</span>
        <span className={classes.value}>{booking.children}</span>
      </React.Fragment>) : ""}
      {booking.babies ? (<React.Fragment>
        <span className={classes.label}>{t("Babies:")}</span>
        <span className={classes.value}>{booking.babies}</span>
      </React.Fragment>) : ""}
      {booking.guest_contact ?
        <React.Fragment>
          <span className={classes.label}>{t("Contact:")}</span>
          <div className={classes.value}>{booking.guest_contact.match(/[^\r\n]+/g)!.map(s => <div dangerouslySetInnerHTML={{__html: detectPhoneAndMail(s)}}/>)}</div>
        </React.Fragment>
        : ""}
      {booking.notes ?
        <React.Fragment>
          <span className={classes.label}>{t("Remarks:")}</span>
          <span className={classes.value}>{booking.notes.match(/[^\r\n]+/g)!.map(s => <React.Fragment>{s}<br/></React.Fragment>)}</span>
        </React.Fragment>
        : ""}
    </div>
  );
};


export default BookingQuickView;
