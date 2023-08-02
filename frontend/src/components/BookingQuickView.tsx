import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../common/intlUtils";
import { formatDate } from "../common/dateUtils";
import { Booking, Service, User } from "../types";
import "./BookingQuickView.scss";
import PaymentList from "./PaymentList";
import { useLazyGetPaymentsForBookingQuery } from "../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Unstable_Grid2 as Grid } from "@mui/material";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons/faWhatsapp";
import IconButton from "@mui/material/IconButton";
import FontAwesomeSvgIcon from "./FontAwesomeSvgIcon";
import reactStringReplace from "react-string-replace";
import { green } from "@mui/material/colors";

type BookingQuickViewProps = {
  booking: Booking;
};

const BookingQuickView = (props: BookingQuickViewProps) => {
  const { booking } = props;
  const { t } = useTranslation();
  const user = useSelector<RootState>((store) => store.auth.user) as User;
  const showPayments = user.permissions.includes("core.view_payment");
  const [triggerPayments, { data }] = useLazyGetPaymentsForBookingQuery();

  const whatsAppPhoneNumber = (phone: string): string => {
    return phone.replace(/^00/, "")
      .replace(/^0/, "33")
      .replace("+", "")
      .replaceAll(" ", "")
  };

  const detectPhoneAndMail = (str: string) => {
    let result = reactStringReplace(str, /([\w._-]+@[\w.-]+\.[\w-]+)/g, (email, i) => (
      <a key={i} href={"mailto:" + email}>
        {email}
      </a>
    ));
    result = reactStringReplace(
      result,
      /(([+][\s./0-9]*)?[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g,
      (phone, i) => (
        <span key={i}>
          <a href={"tel:" + phone}>{phone}</a>
          <a href={"https://wa.me/" + whatsAppPhoneNumber(phone)} target="_blank" rel="noreferrer">
            <IconButton aria-label="WhatsApp">
              <FontAwesomeSvgIcon icon={faWhatsapp} sx={{ color: green[500] }} />
            </IconButton>
          </a>
        </span>
      )
    );
    return result;

    // str.match(/([\w._-]+@[\w.-]+\.[\w-]+)/g)?.reduce((s, email) => s.replace(email, <a href="mailto:{{email}}">{email}</a>));

    // const email = str.search(/([\w._-]+@[\w.-]+\.[\w-]+)/g);
    // // const s1 = str.replace(/([\w._-]+@[\w.-]+\.[\w-]+)/g, "<a href=\"mailto:$1\">$1</a>");
    // const phone = str.search(/(([+][\s./0-9]*)?[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g);
    // return (
    //   <>
    //     {reactStringReplace(str, /(([+][\s./0-9]*)?[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g, (phone, i) => (
    //       <span key={i}>
    //         <a href="tel:{phone}">{phone}</a>
    //         <IconButton aria-label="Example">
    //           <FontAwesomeSvgIcon icon={faInfo} />
    //         </IconButton>
    //       </span>
    //     ))}
    //   </>
    // );
    // return s1.replace(/(([+][\s./0-9]*)?[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g, "<a href=\"tel:$1\">$1</a>" +
    //   "<IconButton aria-label=\"Example\">\n" +
    //   "  <FontAwesomeSvgIcon icon={faInfo} />\n" +
    //   "</IconButton>");
  };

  useEffect(() => {
    if (showPayments && booking.id) triggerPayments(booking.id);
  }, [booking.id, showPayments, triggerPayments]);

  return (
    <Grid container className="booking-quick-view">
      <Grid xs={4}>
        <div className="label">{t("Check-in:")}</div>
        <div className="value">{formatDate(booking.begin_date, "PPPP")}</div>
        <div className="label">{t("Check-out:")}</div>
        <div className="value">{formatDate(booking.end_date, "PPPP")}</div>
        <div className="label">{t("Length of stay:")}</div>
        <div className="value">
          {booking.duration} {t("nights")}
        </div>
        <div className="label">{t("Adults:")}</div>
        <div className="value">{booking.adults}</div>
        {booking.children ? (
          <React.Fragment>
            <div className="label">{t("Children:")}</div>
            <div className="value">{booking.children}</div>
          </React.Fragment>
        ) : (
          ""
        )}
        {booking.babies ? (
          <React.Fragment>
            <div className="label">{t("Babies:")}</div>
            <div className="value">{booking.babies}</div>
          </React.Fragment>
        ) : (
          ""
        )}
        <div className="label">{t("Status:")}</div>
        <div className="value">{booking.status.name}</div>
        <div className="label">{t("Lodging:")}</div>
        <div className="important-value">{booking.lodging ? booking.lodging.name : t("Cancellation / Waiting")}</div>
        {showPayments && (
          <React.Fragment>
            <div className="label">{t("Price:")}</div>
            <div className="important-value">{formatCurrency(booking.price_with_options)}</div>
          </React.Fragment>
        )}
      </Grid>
      <Grid xs={8}>
        <div className="label">{t("Guest name:")}</div>
        <div className="important-value">{booking.guest_name}</div>

        {booking.guest_address ? (
          <React.Fragment>
            <div className="value">{booking.guest_address}</div>
          </React.Fragment>
        ) : (
          ""
        )}
        {booking.guest_contact ? (
          <React.Fragment>
            <div className="value">
              {booking.guest_contact.match(/[^\r\n]+/g)!.map((s, index) => (
                // eslint-disable-next-line react/no-danger
                // <div key={index} dangerouslySetInnerHTML={{ __html: detectPhoneAndMail(s) }} />)}</div>
                <div key={index}>{detectPhoneAndMail(s)}</div>
              ))}
            </div>
          </React.Fragment>
        ) : (
          ""
        )}
        {booking.arrival_details ? (
          <React.Fragment>
            <div className="label">{t("Arrival:")}</div>
            <div className="value">{booking.arrival_details}</div>
          </React.Fragment>
        ) : (
          ""
        )}
        {booking.notes ? (
          <React.Fragment>
            <div className="label">{t("Remarks:")}</div>
            <div className="value">
              {booking.notes.match(/[^\r\n]+/g)!.map((s, index) => (
                <React.Fragment key={index}>
                  {s}
                  <br />
                </React.Fragment>
              ))}
            </div>
          </React.Fragment>
        ) : (
          ""
        )}

        <div className="label">{t("Options:")}</div>
        {booking.options && (
          <React.Fragment>
            <div className="value">
              {booking.options.map((option: Service) => (
                <li key={option.id}>{option.designation}</li>
              ))}
            </div>
          </React.Fragment>
        )}

        <Grid container>
          <Grid xs={6}>
            {showPayments && (
              <React.Fragment>
                <div className="label">{t("Price:")}</div>
                <div className="value">{formatCurrency(booking.price_with_options)}</div>
              </React.Fragment>
            )}
          </Grid>
          <Grid xs={6}>
            {showPayments && booking.deposit! > 0 && (
              <React.Fragment>
                <div className="label">{t("Deposit:")}</div>
                <div className="value">{formatCurrency(booking.deposit || 0)}</div>
              </React.Fragment>
            )}
          </Grid>
          <Grid xs={6}>
            {showPayments && booking.left_to_pay > 0 && (
              <React.Fragment>
                <div className="label">{t("Left to pay:")}</div>
                <div className="important-value">{formatCurrency(booking.left_to_pay)}</div>
              </React.Fragment>
            )}
            {showPayments && booking.left_to_pay < 0 && (
              <React.Fragment>
                <div className="label">{t("Too perceived:")}</div>
                <div className="value">{formatCurrency(-booking.left_to_pay)}</div>
              </React.Fragment>
            )}
          </Grid>
          <Grid xs={6}>
            {showPayments && booking.commission_fees! > 0 && (
              <React.Fragment>
                <div className="label">{t("Commission fees:")}</div>
                <div className="value">{formatCurrency(booking.commission_fees || 0)}</div>
              </React.Fragment>
            )}
          </Grid>
          {/* Removed because value is not reliable with the one (maybe modified) in contract */}
          <Grid xs={6}>
            {showPayments && booking.lodging && booking.lodging.tourist_tax > 0 && (
              <React.Fragment>
                <div className="label">{t("Tourist tax:")}</div>
                <div className="value">
                  {formatCurrency((booking.lodging.tourist_tax || 0) * booking.duration * booking.adults)}
                </div>
              </React.Fragment>
            )}
          </Grid>
          <Grid xs={6}>
            <div className="label">{t("Channel:")}</div>
            <div className="value">{booking.source?.name}</div>
          </Grid>
        </Grid>

        {showPayments && (
          <>
            <div className="label">{t("Payment:")}</div>
            <div className="value">
              <PaymentList payments={data && data.results ? data.results : []} />
            </div>
          </>
        )}
      </Grid>
    </Grid>
  );
};

export default BookingQuickView;
