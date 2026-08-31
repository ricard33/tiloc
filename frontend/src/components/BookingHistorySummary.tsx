import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { Button, Typography } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { Booking, User } from "../types";
import { RootState } from "../store";
import { formatDate } from "../common/dateUtils";
import BookingHistory from "./BookingHistory";

type Props = {
  booking: Booking;
};

const BookingHistorySummary: React.FC<Props> = ({ booking }) => {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const [expanded, setExpanded] = useState(false);

  const canViewHistory = !!user && user.permissions.includes("core.view_historicalbooking");

  return (
    <>
      <Typography variant="h5" sx={{ marginBottom: "10px" }}>{t("History")}</Typography>
      <Typography variant="body2" color="text.secondary">
        {t("Created on {{date}}", { date: formatDate(booking.created, "Pp") })}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {t("Last modified on {{date}}", { date: formatDate(booking.modified, "Pp") })}
      </Typography>
      {canViewHistory && (
        <>
          <Button
            onClick={() => setExpanded(value => !value)}
            endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            size="small"
            sx={{ textTransform: "none", pl: 0 }}
          >
            {t("Show full history")}
          </Button>
          {expanded && <BookingHistory booking={booking} />}
        </>
      )}
    </>
  );
};

export default BookingHistorySummary;
