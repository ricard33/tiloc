 
import { Booking, BookingChannel, BookingStatus } from "../types";
import React, { ReactElement } from "react";
import FontAwesomeSvgIcon from "../components/FontAwesomeSvgIcon";
import { faAirbnb } from "@fortawesome/free-brands-svg-icons/faAirbnb";
import BookingIcon from "../assets/icones/Booking.com.svg?react";
import HomeawayIcon from "../assets/icones/homeaway.svg?react";
import TripadvisorIcon from "../assets/icones/tripadvisor.svg?react";
import { darken } from "@mui/system";
import { useTranslation } from "react-i18next";
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

export const getBookingStatus = (name: string) => {
  for (const key in BookingStatus) {
    const status = (BookingStatus as any)[key] as BookingStatus;
    if (status.name === name)
      return status;
  }
  console.error(`Status "${name}" not found!`);
  return BookingStatus.NotAvailable;
};

export const getBookingStatuses = () => {
  return Object.keys(BookingStatus).map(name => (BookingStatus as any)[name] as BookingStatus);
};

export interface OtaIconProps {
  color?: string;
  bgColor: string;
  selectedBgColor?: string;
  icon?: ReactElement<any, any>;
}

const commonStyle = {
  width: "1.4rem",
  height: "100%"
};

export const otaBranding: {
  [key: string]: OtaIconProps
} = {
  "Airbnb": {
    color: "white",
    bgColor: "#EB4C60",
    selectedBgColor: darken("#EB4C60", 0.1),
    icon:
      <FontAwesomeSvgIcon
        icon={faAirbnb}
        sx={{
          ...commonStyle
        }}
      />
  },
  "Booking.com": {
    color: "white",
    bgColor: "#163A8F",
    selectedBgColor: darken("#163A8F", 0.1),
    icon:
      <BookingIcon
        className="ota-icon"
        style={{
          ...commonStyle
        }}
      />
  },
  "Abritel": {
    color: "white",
    bgColor: "#0167DC",
    selectedBgColor: darken("#0167DC", 0.1),
    icon:
      <HomeawayIcon
        style={{
          ...commonStyle
        }}
      />
  },
  "Tripadvisor": {
    color: "white",
    bgColor: "#579641",
    selectedBgColor: darken("#579641", 0.1),
    icon:
      <TripadvisorIcon
        style={{
          ...commonStyle
        }}
      />
  }
};

export function getIconAndBgColor(booking: Booking): OtaIconProps {
  if (booking.status === BookingStatus.External.name && booking.source && booking.source.name in otaBranding) {
    return otaBranding[booking.source.name];
  } else
    return {
      bgColor: getBookingStatus(booking.status).color,
      selectedBgColor: darken(getBookingStatus(booking.status).color, 0.1)
    };
}

export const BookingSource = ({ name, defaultBgColor, fullWidth }: { name?: string, defaultBgColor?: string, fullWidth?: boolean }) => {
  const { t } = useTranslation();
  const statusDisplay: OtaIconProps & {
    label: string
  } = name && name in otaBranding
    ? { label: name, ...otaBranding[name] }
    : { label: name ? name : t("Direct booking"), bgColor: defaultBgColor ?? "" };

  return (
    <div
      style={{
        background: statusDisplay.bgColor, color: statusDisplay.color, height: "1.4rem",
        display: "flex", alignItems: "center", flexWrap: "wrap",
        padding: "0 4px",
        ...(fullWidth ? {width: "100%"} : {})
      }}
    >
      {statusDisplay.icon}
      <span style={{ verticalAlign: "text-bottom", height: "1.4rem" }}>
        {statusDisplay.label}
      </span>
    </div>
  );
};

export const BookingStatusLabel = ({ booking }: { booking: Booking }) => {
  const { t } = useTranslation();
  const status = getBookingStatus(booking.status);
  const statusDisplay: OtaIconProps & {
    label: string
  } = status.name === BookingStatus.External.name && booking.source && booking.source.name in otaBranding
    ? { label: booking.source.name, ...otaBranding[booking.source.name] }
    : { label: status.getLabel(t), bgColor: status.color };

  return (
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
  );
};

export const ChannelIcon = ({ channel }: { channel: BookingChannel }) => {
  const icon = (channel && channel.name in otaBranding) ? otaBranding[channel.name].icon : undefined;
  return icon ?? <QuestionMarkIcon />;
}
