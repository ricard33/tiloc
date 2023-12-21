import React from "react";
import clsx from "clsx";
import PerfectScrollbar from "react-perfect-scrollbar";
import { makeStyles } from "@mui/styles";
import {
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  TableSortLabel, Theme
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

import { StatusBullet } from "../../../components";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useNextEventsQuery } from "../../../services/api";
import { formatDate } from "../../../common/dateUtils";
import { parseISO } from "date-fns";
import InOutEvent from "./InOutEvent";

const useStyles = makeStyles((theme: Theme) => ({
  root: {},
  content: {
    padding: 0
  },
  inner: {
    minWidth: 800
  },
  statusContainer: {
    display: "flex",
    alignItems: "center"
  },
  status: {
    marginRight: theme.spacing(1)
  },
  actions: {
    justifyContent: "flex-end"
  }
}));

const statusColors = {
  CHECKOUT: "success",
  CHECKIN: "danger"
};

type Props = {
  className?: string
}

const NextEvents: React.FC<Props> = props => {
  const { className, ...rest } = props;
  const classes = useStyles();
  const { t } = useTranslation();
  const { data: events } = useNextEventsQuery(5);

  // console.log(events);

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardHeader
        // action={
        //   <Button
        //     color="primary"
        //     size="small"
        //     variant="outlined"
        //   >
        //     {t("View planing")}
        //   </Button>
        // }
        title={t("Next arrivals / departures")}
      />
      <Divider />
      <CardContent className={classes.content}>
        <PerfectScrollbar>
          {events && events.map(event => <InOutEvent key={event.event_type + event.id} event={event} />)}
        </PerfectScrollbar>
      </CardContent>
      <Divider />
      <CardActions className={classes.actions}>
        <Button
          component={NavLink}
          color="primary"
          size="small"
          variant="text"
          to="/planning"
        >
          {t("View planning")} <ArrowRightIcon />
        </Button>
      </CardActions>
    </Card>
  );
};

export default NextEvents;
