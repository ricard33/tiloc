import { BookingStatus } from "../types";
import React, { ReactElement } from "react";
import FontAwesomeSvgIcon from "../components/FontAwesomeSvgIcon";
import { faAirbnb } from "@fortawesome/free-brands-svg-icons/faAirbnb";
import { ReactComponent as BookingIcon } from "../assets/icones/Booking.com.svg";
import { ReactComponent as HomeawayIcon } from "../assets/icones/homeaway.svg";
import { ReactComponent as TripadvisorIcon } from "../assets/icones/tripadvisor.svg";

export const getBookingStatus = (name: string) => {
  for (let key in BookingStatus) {
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
    icon:
      <TripadvisorIcon
        style={{
          ...commonStyle
        }}
      />
  }
};
