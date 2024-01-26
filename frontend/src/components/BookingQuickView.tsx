import React, { ReactNode, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../common/intlUtils";
import { formatDate } from "../common/dateUtils";
import { Booking, BookingStatus, Service, User } from "../types";
import "./BookingQuickView.scss";
import { useLazyGetPaymentsForBookingQuery } from "../services/api";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import Grid from "@mui/material/Unstable_Grid2"; // Grid version 2
import { Typography } from "@mui/material";
import Comments from "./Comments";
import { getBookingStatus, otaBranding, OtaIconProps } from "../common/statusUtils";
import Payments from "./Payments";
import GuestContact from "./GuestContact";


type BookingQuickViewProps = {
  booking: Booking;
  readonly?: boolean;
};

const BookingQuickView = (props: BookingQuickViewProps) => {
  const { booking, readonly } = props;
  const { t } = useTranslation();
  const user = useSelector<RootState>((store) => store.auth.user) as User;
  const showPayments = user.permissions.includes("core.view_payment");
  const [triggerPayments, { data }] = useLazyGetPaymentsForBookingQuery();
  const status = getBookingStatus(booking.status);
  const statusDisplay: OtaIconProps & {
    label: string
  } = status.name === BookingStatus.External.name && booking.source && booking.source.name in otaBranding
    ? { label: booking.source.name, ...otaBranding[booking.source.name] }
    : { label: status.getLabel(t), bgColor: status.color };

  useEffect(() => {
    if (showPayments && booking.id) triggerPayments(booking.id);
  }, [booking.id, showPayments, triggerPayments]);

  const displayField = (condition: boolean, label: string | undefined, value: ReactNode | Iterable<ReactNode>, isImportant: boolean = false) => {
    if (condition)
      return <React.Fragment>
        {label && <div className="label">{label}</div>}
        <div className={isImportant ? "important-value" : "value"}>{value}</div>
      </React.Fragment>;
    else
      return "";
  };

  const showComments = booking.comments.length > 0 || !readonly;

  function getGuestsDistribution(distribution: {
    adults: number;
    children: number;
    babies: number;
  }) {
    return t("{{count}} adults", { count: distribution.adults }) +
      (distribution.children ? t(" and {{count}} children", { count: distribution.children }) : "") +
      (distribution.babies ? t(" and {{count}} babies", { count: distribution.babies }) : "");
  }

  return (
    <Grid container spacing={1} className="booking-quick-view">
      <Grid container spacing={1} xs={12} md={showComments ? 8 : 12}>
        {/*<Grid xs={12}>*/}
        {/*  <Typography variant="h5" component="div">*/}
        {/*    {booking.guest_name}*/}
        {/*  </Typography>*/}
        {/*</Grid>*/}
        <Grid sm={4} xs={12}>
          <div>
            <Grid container>
              {/*<StyledDiv>*/}
              {/*  <LoginIcon style={{ color: statusColors["CHECKIN"], marginRight: "10px" }} />*/}
              {/*  <span style={{ fontSize: 14, fontWeight: "300" }}>*/}
              {/*    {formatDate(booking.begin_date, "PP")}*/}
              {/*  </span>*/}
              {/*</StyledDiv>*/}
              {/*<StyledDiv>*/}
              {/*  <LogoutIcon style={{ color: statusColors["CHECKOUT"], marginRight: "10px" }} />*/}
              {/*  <span style={{ fontSize: 14, fontWeight: "300" }}>*/}
              {/*    {formatDate(booking.end_date, "PP")}*/}
              {/*  </span>*/}
              {/*</StyledDiv>*/}
              {/*<StyledDiv>*/}
              {/*  <NightsStayIcon*/}
              {/*    fontSize="small" style={{ marginRight: "10px" }}*/}
              {/*  />&nbsp;{t("{{count}} nights", { count: booking.duration })}*/}
              {/*</StyledDiv>*/}
              {/*<StyledDiv>*/}
              {/*  <Groups2OutlinedIcon*/}
              {/*    fontSize="small" style={{ marginRight: "10px" }}*/}
              {/*  />&nbsp;{t("{{count}} guests", { count: booking.adults + booking.children + booking.babies })}*/}
              {/*</StyledDiv>*/}
              {/*{*/}
              {/*  booking.lodgings.length > 1 ?*/}

              {/*    booking.lodgings.map(l => displayField(true, l.name,*/}
              {/*      getGuestsDistribution(booking.guests_distribution[l.id])*/}
              {/*    ))*/}
              {/*    :*/}
              {/*    <div>*/}
              {/*      {getGuestsDistribution(booking.guests_distribution[booking.lodgings[0].id])}*/}
              {/*    </div>*/}

              {/*}*/}
              {/*<StyledDiv>*/}
              {/*  <MonetizationOnOutlinedIcon*/}
              {/*    style={{ marginRight: "10px" }}*/}
              {/*    fontSize="small"*/}
              {/*  />&nbsp;{DecimalPrecision.round(booking.price_with_options)}&nbsp;€*/}
              {/*</StyledDiv>*/}
              {/*<StyledDiv>*/}
              {/*  <HomeOutlinedIcon*/}
              {/*    fontSize="small" style={{ marginRight: "10px" }}*/}
              {/*  />&nbsp;{booking.lodgings.map(l => l.name).join("+")}*/}
              {/*</StyledDiv>*/}
              {/*<StyledDiv>*/}
              {/*  {statusDisplay.icon}*/}
              {/*  <span style={{ verticalAlign: "text-bottom" }}>*/}
              {/*    {statusDisplay.label}*/}
              {/*  </span>*/}
              {/*</StyledDiv>*/}

              <Grid sm={12} xs={6}>
                {displayField(true, t("Check-in"), formatDate(booking.begin_date, "PPPP"))}
              </Grid>
              <Grid sm={12} xs={6}>
                {displayField(true, t("Check-out"), formatDate(booking.end_date, "PPPP"))}
              </Grid>
              <Grid sm={12} xs={6}>
                {displayField(true, t("Length of stay"), t("{{count}} nights", { count: booking.duration }))}
              </Grid>
              <Grid sm={12} xs={6}>
                {displayField(true, t("Status"),
                  <div
                    style={{
                      background: statusDisplay.bgColor, color: statusDisplay.color, height: "1.4rem",
                      display: "flex", alignItems: "center", flexWrap: "wrap"
                    }}
                  >
                    {statusDisplay.icon}
                    <span style={{ verticalAlign: "text-bottom" }}>
                      {statusDisplay.label}
                    </span>
                  </div>
                  // booking.status !== BookingStatus.External.name
                  //   ? getBookingStatus(booking.status).getLabel(t)
                  //   : booking.source?.name
                )}
              </Grid>
              <Grid xs={12}>
                {
                  booking.lodgings.length > 1 ?
                    booking.lodgings.map(l => displayField(true, l.name,
                      getGuestsDistribution(booking.guests_distribution[l.id])
                    ))
                    :
                    displayField(true, t("Total guests"),
                      getGuestsDistribution(booking.guests_distribution[booking.lodgings[0].id])
                    )}
              </Grid>
              <Grid sm={12} xs={6}>
                {displayField(showPayments, t("Lodging"), booking.lodgings.map(l => l.name).join("+"), true)}
              </Grid>
              <Grid sm={12} xs={6}>
                {displayField(showPayments, t("Price"), formatCurrency(booking.price_with_options), true)}
              </Grid>
            </Grid>
          </div>
        </Grid>
        <Grid sm={8} xs={12}>
          {displayField(true, t("Guest name"), booking.guest_name, true)}

          {displayField(booking.guest_address != null, undefined, booking.guest_address)}
          {displayField(booking.guest_contact != null, undefined,
            <GuestContact value={booking.guest_contact} />
            // booking.guest_contact && booking.guest_contact.match(/[^\r\n]+/g)!.map((s, index) => (
            //   <div key={index}><PhoneOrEmail value={s} /></div>
            // ))
          )}
          {displayField(!!booking.arrival_details, t("Check-in info"), booking.arrival_details)}
          {displayField(!!booking.departure_details, t("Check-out info"), booking.departure_details)}
          {displayField(!!booking.notes, t("Remarks"),
            booking.notes && booking.notes.match(/[^\r\n]+/g)!.map((s, index) => (
              <React.Fragment key={index}>
                {s}
                <br />
              </React.Fragment>
            )))}

          {displayField(booking.options.length > 0, t("Options"),
            booking.options.map((option: Service) => (
              <li key={option.id}>{option.designation}</li>
            ))
          )}

          <Grid container columns={{ xs: 2, sm: 3, md: 4, lg: 6 }}>
            <Grid xs={1}>
              {displayField(showPayments, t("Price"), formatCurrency(booking.price_with_options))}
            </Grid>
            <Grid xs={1}>
              {displayField(showPayments && booking.deposit! > 0, t("Deposit"), formatCurrency(booking.deposit || 0))}
            </Grid>
            <Grid xs={1}>
              {displayField(showPayments && booking.left_to_pay > 0, t("Left to pay"), formatCurrency(booking.left_to_pay), true)}
              {displayField(showPayments && booking.left_to_pay < 0, t("Too perceived"), formatCurrency(-booking.left_to_pay))}
            </Grid>
            <Grid xs={1}>
              {displayField(showPayments && booking.commission_fees! > 0, t("Commission fees"), formatCurrency(booking.commission_fees || 0))}
            </Grid>
            <Grid xs={1}>
              {displayField(showPayments && booking.tourist_tax > 0,
                t("Tourist tax"),
                formatCurrency(booking.tourist_tax || 0)
              )}
            </Grid>
            <Grid xs={1}>
              {displayField(booking.source !== null, t("Channel"), booking.source?.name)}
            </Grid>
          </Grid>
        </Grid>
        <Grid xs={12}>
          {displayField(showPayments && data != null,
            t("Payment"), <Payments bookingId={booking.id!} />
          )}
        </Grid>
      </Grid>
      {showComments &&
        <Grid xs={12} md={4}>
          <Typography variant="h5" sx={{ marginBottom: "10px" }}>{t("Comments")}</Typography>
          <Comments booking={booking} readonly={readonly} />
        </Grid>}
    </Grid>
  );
};

export default BookingQuickView;
