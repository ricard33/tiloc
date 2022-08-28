import React from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../common/intlUtils";
import { formatDate } from "../common/dateUtils";
import { parseISO } from "date-fns";
import { FieldArrayWithId } from "react-hook-form";
import { Booking, Lodging, Service } from "../types";
import { Grid } from "@mui/material";
import "./BookingQuickView.scss";
import PaymentList from "./PaymentList";
import { useGetPaymentsForBookingQuery } from "../services/api";

type BookingQuickViewProps = {
  booking: Booking;
};

const BookingQuickView = (props: BookingQuickViewProps) => {
  const { booking } = props;
  const { t } = useTranslation();
  const { data } = useGetPaymentsForBookingQuery(booking.id!);

  const detectPhoneAndMail = (str: string) => {
    const s1 = str.replace(/([\w._-]+@[\w.-]+\.[\w-]+)/g, "<a href=\"mailto:$1\">$1</a>");
    return s1.replace(/(([+][\s./0-9]*)?[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g, "<a href=\"tel:$1\">$1</a>");
  };

  return (
    <Grid container className="booking-quick-view">
      <Grid item xs={4}>
        <div className="label">{t("Check-in:")}</div>
        <div className="value">{formatDate(parseISO(booking.begin_date), "PPPP")}</div>
        <div className="label">{t("Check-out:")}</div>
        <div className="value">{formatDate(parseISO(booking.end_date), "PPPP")}</div>
        <div className="label">{t("Length of stay:")}</div>
        <div className="value">{booking.duration} {t("nights")}</div>
        <div className="label">{t("Adults:")}</div>
        <div className="value">{booking.adults}</div>
        {booking.children ? (<React.Fragment>
          <div className="label">{t("Children:")}</div>
          <div className="value">{booking.children}</div>
        </React.Fragment>) : ""}
        {booking.babies ? (<React.Fragment>
          <div className="label">{t("Babies:")}</div>
          <div className="value">{booking.babies}</div>
        </React.Fragment>) : ""}
        <div className="label">{t("Status:")}</div>
        <div className="value">{booking.status.name}</div>
        <div className="label">{t("Lodging:")}</div>
        <div className="important-value">{booking.lodging ? booking.lodging.name : t("Cancellation / Waiting")}</div>
        <div className="label">{t("Price:")}</div>
        <div className="important-value">{formatCurrency(booking.price_with_options)}</div>
      </Grid>
      <Grid item xs={8}>
        <div className="label">{t("Guest name:")}</div>
        <div className="important-value">{booking.guest_name}</div>

        {booking.guest_address ?
          <React.Fragment>
            <div className="value">{booking.guest_address}</div>
          </React.Fragment>
          : ""}
        {booking.guest_contact ?
          <React.Fragment>
            <div className="value">{booking.guest_contact.match(/[^\r\n]+/g)!.map(s => <div
              dangerouslySetInnerHTML={{ __html: detectPhoneAndMail(s) }}
            />)}</div>
          </React.Fragment>
          : ""}
        {booking.notes ?
          <React.Fragment>
            <div className="label">{t("Remarks:")}</div>
            <div className="value">{booking.notes.match(/[^\r\n]+/g)!.map(s =>
              <React.Fragment>{s}<br /></React.Fragment>)}</div>
          </React.Fragment>
          : ""}

        <div className="label">{t("Options:")}</div>
        {booking.options && <React.Fragment>
          <div className="value">{booking.options.map((option: Service, index: number) => (
            <li>{option.designation}</li>
          ))
          }</div>
        </React.Fragment>}

        <Grid container>
          <Grid item xs={6}>
            <div className="label">{t("Price:")}</div>
            <div className="value">{formatCurrency(booking.price_with_options)}</div>
          </Grid>
          <Grid item xs={6}>
            {booking.deposit! > 0 && <React.Fragment>
              <div className="label">{t("Deposit:")}</div>
              <div className="value">{formatCurrency(booking.deposit)}</div>
            </React.Fragment>}
          </Grid>
          <Grid item xs={6}>
            {booking.left_to_pay > 0 && <React.Fragment>
              <div className="label">{t("Left to pay:")}</div>
              <div className="important-value">{formatCurrency(booking.left_to_pay)}</div>
            </React.Fragment>}
            {booking.left_to_pay < 0 && <React.Fragment>
              <div className="label">{t("Too perceived:")}</div>
              <div className="value">{formatCurrency(-booking.left_to_pay)}</div>
            </React.Fragment>}
          </Grid>
          <Grid item xs={6}>
            <div className="label">{t("Channel:")}</div>
            <div className="value">{booking.source?.name}</div>
          </Grid>
        </Grid>

        <div className="label">{t("Payments:")}</div>
        <div className="value">
          <PaymentList payments={data ? data.results : []} />
        </div>


      </Grid>
    </Grid>
  );
};


export default BookingQuickView;
