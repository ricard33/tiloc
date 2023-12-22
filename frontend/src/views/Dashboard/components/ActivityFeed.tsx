import React, { useState } from "react";
import { Card, CardContent, CardHeader, Divider, Stack } from "@mui/material";
import Timeline from "@mui/lab/Timeline";

import { useTranslation } from "react-i18next";
import { formatDate } from "../../../common/dateUtils";
import { useListActivitiesQuery } from "../../../services/api";
import {
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  timelineItemClasses,
  TimelineSeparator
} from "@mui/lab";
import { Activity } from "../../../types";
import { BookingSource } from "../../../common/statusUtils";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import BookingTooltip from "../../../components/BookingTooltip";

type Props = {
  className?: string
}

const ActivityFeed: React.FC<Props> = props => {
  const { className, ...rest } = props;

  const { t } = useTranslation();
  const count = 100;
  const { data: activities, refetch } = useListActivitiesQuery({
    page_size: count
  });

  /* eslint-disable react/no-multi-comp */
  function Sep() {
    return <span style={{ margin: "0 4px" }}>-</span>;
  }

  /* eslint-disable react/no-multi-comp */
  function ActivityItem({ activity }: { activity: Activity }) {
    const [open, setOpen] = useState(false);

    function handleClose() {
      setOpen(false);
      refetch();
    }

    return (
      <>
        <TimelineItem onClick={() => setOpen(true)} style={{cursor: "pointer"}}>
          <TimelineSeparator>
            <TimelineDot style={{backgroundColor: getActivityColor(activity)}} />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent style={{ fontSize: "smaller" }}>
            <Stack direction={"column"}>
              <Stack direction={"row"}>
                {formatDate(activity.date, "P")}
                <Sep />{getActivityLabel(activity)}
                <Sep /><BookingSource booking={activity.booking} />
              </Stack>
              <Stack direction={"row"} style={{ flexWrap: "wrap" }}>
                <HomeOutlinedIcon fontSize="small" />&nbsp;{activity.booking.lodging.name}
                <Sep /><PersonOutlineIcon fontSize="small" />&nbsp;{activity.booking.guest_name}
                <Sep /><CalendarMonthOutlinedIcon fontSize="small" />&nbsp;
                <span>{formatDate(activity.booking.begin_date, "P")}</span>
                <span style={{ margin: "0 4px" }}>-</span>
                <span>{formatDate(activity.booking.end_date, "P")}</span>
              </Stack>
            </Stack>
          </TimelineContent>
        </TimelineItem>
        <BookingTooltip
          booking={activity.booking}
          open={open}
          onClose={() => handleClose()}
        />
      </>
    );
  }

  function getActivityLabel(activity: Activity) {
    switch (activity.type) {
      case "add_booking":
        return t("Booking");
      case "modify_booking":
        return t("Modification of booking");
      case "delete_booking":
        return t("Booking deleted");
      case "cancel_booking":
        return t("Cancellation");
      case "uncancel_booking":
        return t("Modification of booking");
      case "add_comment":
        return t("Comment");
      case "modify_comment":
        return t("Modification of comment");
      case "delete_comment":
        return t("Comment deleted");
    }
  }

  function getActivityColor(activity: Activity) {
    switch (activity.type) {
      case "add_booking":
        return "#2196f3";
      case "modify_booking":
      case "uncancel_booking":
      case "add_comment":
      case "modify_comment":
      case "delete_comment":
        return "#FFF07C";
      case "delete_booking":
      case "cancel_booking":
        return "#f45b69";
    }
  }

  return (
    <Card
      {...rest}
      className={className}
    >
      <CardHeader
        // action={
        //   <Button
        //     color="primary"
        //     size="small"
        //     variant="outlined"
        //   >
        //     New entry
        //   </Button>
        // }
        title={t("Activity Feed")}
      />
      <Divider />
      <CardContent style={{ maxHeight: "300px", overflowY: "scroll", overflowX: "hidden" }}>
        <Timeline
          sx={{
            [`& .${timelineItemClasses.root}:before`]: {
              flex: 0,
              padding: 0
            }
          }}
        >
          {activities && activities.map((activity, i) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </Timeline>
      </CardContent>
      <Divider />
      {/*<CardActions>*/}
      {/*  <Button*/}
      {/*    component={NavLink}*/}
      {/*    color="primary"*/}
      {/*    size="small"*/}
      {/*    variant="text"*/}
      {/*    to="/planning"*/}
      {/*  >*/}
      {/*    {t("View all")} <ArrowRightIcon />*/}
      {/*  </Button>*/}
      {/*</CardActions>*/}
    </Card>
  );
};

export default ActivityFeed;
