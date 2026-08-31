import React from "react";
import { useTranslation } from "react-i18next";
import { parseISO } from "date-fns";
import { useSelector } from "react-redux";
import Timeline from "@mui/lab/Timeline";
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator
} from "@mui/lab";
import { CircularProgress, Typography } from "@mui/material";
import Box from "@mui/material/Box";

import { Booking, BookingHistoryChange, BookingHistoryEntry, User } from "../types";
import { RootState } from "../store";
import { useGetBookingHistoryQuery } from "../services/api";
import { formatDate } from "../common/dateUtils";
import { getBookingStatus } from "../common/statusUtils";

type Props = {
  booking: Booking;
};

const DATE_FIELDS = new Set(["begin_date", "end_date"]);

const DOT_COLOR: Record<BookingHistoryEntry["type"], string> = {
  "+": "#2196f3",
  "~": "#FFF07C",
  "-": "#f45b69"
};

const BookingHistory: React.FC<Props> = ({ booking }) => {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const { data: entries, isLoading, isError } = useGetBookingHistoryQuery(booking.id as number, {
    skip: !booking.id
  });

  if (!user || !user.permissions.includes("core.view_historicalbooking"))
    return null;

  const fieldLabels: Record<string, string> = {
    status: t("Booking status"),
    lodging_ids: t("Lodging"),
    begin_date: t("Arrival"),
    end_date: t("Departure"),
    duration: t("Nights"),
    guest_name: t("Full guest name"),
    guest_contact: t("Phone / email"),
    guest_address: t("Address"),
    price: t("Total"),
    daily_rate: t("Daily rate"),
    is_flat_rate: t("Flat rate"),
    deposit: t("Deposit"),
    guaranty: t("Security deposit"),
    commission_fees: t("Commission fees"),
    custom_tourist_tax: t("Tourist tax"),
    tourist_tax_rate: t("Tourist tax"),
    max_daily_tourist_tax: t("Tourist tax"),
    arrival_details: t("Check-in info"),
    departure_details: t("Check-out info"),
    notes: t("Further information"),
    catering: t("Catering"),
    cancelled: t("Cancelled"),
    source: t("Statistics")
  };

  function fieldLabel(field: string) {
    return fieldLabels[field] ?? field;
  }

  function formatValue(field: string, value: unknown) {
    if (value === null || value === undefined || value === "")
      return "—";
    if (typeof value === "boolean")
      return value ? t("Yes") : t("No");
    if (field === "status")
      return getBookingStatus(String(value)).getLabel(t);
    if (DATE_FIELDS.has(field))
      return formatDate(parseISO(String(value)), "P");
    return String(value);
  }

  function describeChange(change: BookingHistoryChange) {
    return `${fieldLabel(change.field)}: ${formatValue(change.field, change.old)} → ${formatValue(change.field, change.new)}`;
  }

  function entryTitle(entry: BookingHistoryEntry) {
    if (entry.type === "+")
      return t("Booking created");
    if (entry.type === "-")
      return t("Booking deleted");
    return t("Modification");
  }

  if (isLoading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );

  if (isError)
    return <Typography color="error">{t("Unable to load the history")}</Typography>;

  if (!entries || entries.length === 0)
    return <Typography color="text.secondary">{t("No modifications recorded")}</Typography>;

  return (
    <Timeline
      sx={{
        [`& .${timelineItemClasses.root}:before`]: {
          flex: 0,
          padding: 0
        }
      }}
    >
      {entries.map((entry, index) => (
        <TimelineItem key={entry.history_id}>
          <TimelineSeparator>
            <TimelineDot style={{ backgroundColor: DOT_COLOR[entry.type] }} />
            {index < entries.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent sx={{ pb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {formatDate(entry.date, "Pp")}
              {" — "}
              {entry.user ? entry.user.full_name : t("Automatic synchronization")}
            </Typography>
            {entry.changes.length > 0 ? (
              entry.changes.map(change => (
                <Typography key={change.field} variant="body2">
                  {describeChange(change)}
                </Typography>
              ))
            ) : (
              <Typography variant="body2">{entryTitle(entry)}</Typography>
            )}
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};

export default BookingHistory;
