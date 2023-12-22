import React from "react";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Theme } from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useNextEventsQuery } from "../../../services/api";
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
        {events &&
            events.map(event => <InOutEvent key={event.event_type + event.id} event={event} />)
        }
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
