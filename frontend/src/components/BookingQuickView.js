import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/core/styles";
import { useTranslation } from "react-i18next";
import moment from "moment";
import { formatCurrency } from "../common/intlUtils";

const useStyles = makeStyles((theme) => ({
  label: {},
  value: {
    fontWeight: "bold"
  },
  spacer: {
    width: '40px',
    display: 'inline-block',
  }
}));

const BookingQuickView = props => {
  const { booking } = props;
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <div id="qv_status"><span className={classes.value}>{booking.status.name}</span></div>
      <div id="qv_guest">
        <span className={classes.label}>{t("Guest:")}</span>&nbsp;
        <span className={classes.value}>{booking.guest_name}</span>
      </div>
      <div id="qv_lodging">
        <span className={classes.label}>{t("Lodging:")}</span>&nbsp;
        <span className={classes.value}>{booking.lodging ? booking.lodging.name : t("Cancellation / Waiting")}</span>
      </div>
      <div id="qv_begin">
        <span className={classes.label}>{t("From:")}</span>&nbsp;
        <span className={classes.value}>{moment(booking.begin_date).format("dddd LL")}</span>
      </div>
      <div id="qv_end">
        <span className={classes.label}>{t("To:")}</span>&nbsp;
        <span className={classes.value}>{moment(booking.end_date).format("dddd LL")}</span>
      </div>
      <div id="qv_nights">
        <span className={classes.label}>{t("Nights:")}</span>&nbsp;
        <span className={classes.value}>{booking.duration}</span>
      </div>
      <div id="qv_price">
        <span className={classes.label}>{t("Price:")}</span>&nbsp;
        <span className={classes.value}>{formatCurrency(booking.price)}</span>
        <span className={classes.spacer} />
        { booking.left_to_pay > 0 && <span>
          <span className={classes.label}>{t("Left to pay:")}</span>&nbsp;
          <span className={classes.value}>{formatCurrency(booking.left_to_pay)}</span></span>}
        { booking.left_to_pay < 0 && <span>
          <span className={classes.label}>{t("Too perceived:")}</span>&nbsp;
          <span className={classes.value}>{formatCurrency(-booking.left_to_pay)}</span></span>}
      </div>
      <div id="qv_guests_count">
        <span className={classes.label}>{t("Adults:")}</span>&nbsp;
        <span className={classes.value}>{booking.adults}</span>
        {booking.children ? (<React.Fragment>&nbsp;/&nbsp;<span className={classes.label}>{t("Children:")}</span>&nbsp;
          <span className={classes.value}>{booking.children}</span></React.Fragment>) : ""}
        {booking.babies ? (<React.Fragment>&nbsp;/&nbsp;<span className={classes.label}>{t("Babies:")}</span>&nbsp;
          <span className={classes.value}>{booking.babies}</span></React.Fragment>) : ""}
      </div>
      {booking.guest_contact ?
        <div id="qv_contact">
          <span className={classes.label}>{t("Contact:")}</span>&nbsp;
          <span className={classes.value}>{booking.guest_contact}</span>
        </div>
        : ""}
      {booking.special_conditions ?
        <div id="qv_conditions">
          <span className={classes.label}>{t("Remarks:")}</span>&nbsp;
          <span className={classes.value}>{booking.special_conditions}</span>
        </div>
        : ""}
    </React.Fragment>
  );
};

BookingQuickView.propTypes = {
  booking: PropTypes.shape({
    status: PropTypes.shape({
      name: PropTypes.string,
      color: PropTypes.string
    }),
    guest_name: PropTypes.string,
    guest_contact: PropTypes.string,
    lodging: PropTypes.shape({
      name: PropTypes.string
    }),
    begin_date: PropTypes.string,
    end_date: PropTypes.string,
    duration: PropTypes.number,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    adults: PropTypes.number,
    children: PropTypes.number,
    babies: PropTypes.number,
    special_conditions: PropTypes.string,
  })
};

export default BookingQuickView;
