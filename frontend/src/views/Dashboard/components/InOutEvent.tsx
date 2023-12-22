import React from "react";
import { Stack } from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import NightsStayOutlinedIcon from "@mui/icons-material/NightsStayOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../common/dateUtils";
import { parseISO } from "date-fns";
import { NextEvent } from "../../../types";
import Box from "@mui/material/Box";

const statusColors = {
  CHECKIN: "#3b4aff",
  CHECKOUT: "#f45b69"
};

type Props = {
  className?: string,
  event: NextEvent,
}

const InOutEvent: React.FC<Props> = props => {
  const { className, event, ...rest } = props;
  const { t } = useTranslation();

  // console.log(events);
  /* eslint-disable react/no-multi-comp */
  function Sep() {
    return <HorizontalRuleIcon fontSize="small"/>
  }

  return (
    <Box {...rest} className={className}>
      <Stack direction={"row"} spacing={1} margin={1}>
        {event.event_type === "CHECKIN" ?
          <LoginIcon fontSize="large" style={{ color: statusColors[event.event_type] }} /> :
          <LogoutIcon  fontSize="large" style={{ color: statusColors[event.event_type] }} />
        }
        <Stack direction={"column"} style={{ fontWeight: "300" }} spacing={0}>
          <div><span style={{ color: statusColors[event.event_type] }}>
            {{ CHECKIN: t("arrival"), CHECKOUT: t("departure") }[event.event_type]}
          </span> {t("on {{date}}", { date: formatDate(parseISO(event.date), "PPPP") })}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              fontSize: "smaller",
            }}
          >
            <HomeOutlinedIcon fontSize="small" />&nbsp;{event.lodging_name}
            <Sep/><NightsStayOutlinedIcon fontSize="small" />&nbsp;{event.duration}
            <Sep/><Groups2OutlinedIcon fontSize="small" />&nbsp;{event.guests}
            <Sep/><PersonOutlineIcon fontSize="small" />&nbsp;{event.guest_name}
          </div>
        </Stack>
      </Stack>
    </Box>
  );
};

export default InOutEvent;
