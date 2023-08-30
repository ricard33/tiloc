import React, { useEffect } from "react";
import { ReactI18NextChild, useTranslation } from "react-i18next";
import { formatCurrency } from "../common/intlUtils";
import { formatDate } from "../common/dateUtils";
import { Booking, Service, User } from "../types";
import "./BookingQuickView.scss";
import PaymentList from "./PaymentList";
import { useLazyGetPaymentsForBookingQuery } from "../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import Grid from '@mui/material/Unstable_Grid2'; // Grid version 2
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons/faWhatsapp";
import IconButton from "@mui/material/IconButton";
import FontAwesomeSvgIcon from "./FontAwesomeSvgIcon";
import reactStringReplace from "../common/reactStringReplace";
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
      .replace(/^0696/, "596696")
      .replace(/^0596/, "596696")
      .replace(/^00/, "")
      .replace(/^0/, "33")
      .replace("+", "")
      .replaceAll(" ", "");
  };

  const detectPhoneAndMail = (str: string) => {
    let result = reactStringReplace(str, /([\w._-]+@[\w.-]+\.[\w-]+)/g, (email, i) => (
      <a key={i} href={"mailto:" + email}>
        {email}
      </a>
    ));
    result = reactStringReplace(
      result,
      /([+]?[\s./0-9]*[(]?[0-9]{1,4}[)]?[0-9][-\s./0-9]{6,12}[0-9])/g,
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

  const displayField = (condition: boolean, label: string | undefined, value: ReactI18NextChild | Iterable<ReactI18NextChild>, isImportant: boolean = false) => {
    if (condition)
      return <React.Fragment>
        {label && <div className="label">{label}</div>}
        <div className={isImportant ? "important-value" : "value"}>{value}</div>
      </React.Fragment>;
    else
      return "";
  };

  return (
    <Grid container spacing={1} className="booking-quick-view">
      <Grid xs={4}>
        {displayField(true, t("Check-in:"), formatDate(booking.begin_date, "PPPP"))}
        {displayField(true, t("Check-out:"), formatDate(booking.end_date, "PPPP"))}
        {displayField(true, t("Length of stay:"), t("{{count}} nights", {count: booking.duration}))}
        {displayField(true, t("Total guests:"),
          t("{{count}} adults", { count: booking.adults }) +
          (booking.children ? t(" and {{count}} children", { count: booking.children }) : "") +
          (booking.babies ? t(" and {{count}} babies", { count: booking.babies }) : "")
        )}
        {displayField(true, t("Status:"), booking.status.name)}
        {displayField(showPayments, t("Lodging:"), booking.lodging ? booking.lodging.name : t("Cancellation / Waiting"), true)}
        {displayField(showPayments, t("Price:"), formatCurrency(booking.price_with_options), true)}
      </Grid>
      <Grid xs={8}>
        {displayField(true, t("Guest name:"), booking.guest_name, true)}

        {displayField(booking.guest_address != null, undefined, booking.guest_address)}
        {displayField(booking.guest_contact != null, undefined,
          booking.guest_contact && booking.guest_contact.match(/[^\r\n]+/g)!.map((s, index) => (
            // eslint-disable-next-line react/no-danger
            // <div key={index} dangerouslySetInnerHTML={{ __html: detectPhoneAndMail(s) }} />)}</div>
            <div key={index}>{detectPhoneAndMail(s)}</div>
          )))}
        {displayField(booking.arrival_details != null, t("Arrival:"), booking.arrival_details)}
        {displayField(booking.notes != null, t("Remarks:"),
          booking.notes && booking.notes.match(/[^\r\n]+/g)!.map((s, index) => (
            <React.Fragment key={index}>
              {s}
              <br />
            </React.Fragment>
          )))}

        {displayField(booking.options.length > 0, t("Options:"),
          booking.options.map((option: Service) => (
            <li key={option.id}>{option.designation}</li>
          ))
        )}

        <Grid container columns={{ xs: 2, sm: 3, md: 4, lg: 6 }}>
          <Grid xs={1}>
            {displayField(showPayments, t("Price:"), formatCurrency(booking.price_with_options))}
          </Grid>
          <Grid xs={1}>
            {displayField(showPayments && booking.deposit! > 0, t("Deposit:"), formatCurrency(booking.deposit || 0))}
          </Grid>
          <Grid xs={1}>
            {displayField(showPayments && booking.left_to_pay > 0, t("Left to pay:"), formatCurrency(booking.left_to_pay), true)}
            {displayField(showPayments && booking.left_to_pay < 0, t("Too perceived:"), formatCurrency(-booking.left_to_pay))}
          </Grid>
          <Grid xs={1}>
            {displayField(showPayments && booking.commission_fees! > 0, t("Commission fees:"), formatCurrency(booking.commission_fees || 0))}
          </Grid>
          {/* Removed because value is not reliable with the one (maybe modified) in contract */}
          <Grid xs={1}>
            {displayField(showPayments && booking.lodging && booking.lodging.tourist_tax > 0,
              t("Tourist tax:"),
              formatCurrency((booking.lodging.tourist_tax || 0) * booking.duration * booking.adults)
            )}
          </Grid>
          <Grid xs={1}>
            {displayField(booking.source !== null, t("Channel:"), booking.source?.name)}
          </Grid>
        </Grid>

        {displayField(showPayments && data != null && data.results.length > 0,
          t("Payment:"), <PaymentList payments={data && data.results ? data.results : []} />)}
      </Grid>
    </Grid>
  );
};

export default BookingQuickView;
