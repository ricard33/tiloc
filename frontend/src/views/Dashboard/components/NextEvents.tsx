import React from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Divider, Typography } from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useNextEventsQuery } from "../../../services/api";
import InOutEvent from "./InOutEvent";


type Props = {
  className?: string
}

const NextEvents: React.FC<Props> = props => {
  const { className, ...rest } = props;
  const { t } = useTranslation();
  const { data: events } = useNextEventsQuery(5);

  // console.log(events);

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
        //     {t("View planing")}
        //   </Button>
        // }
        title={t("Next arrivals / departures")}
      />
      <Divider />
      <CardContent sx={{padding: 0}}>
        {(events && events.length > 0) ?
          events.map(event => <InOutEvent key={event.event_type + event.id} event={event} />)
          :
          <Typography style={{ color: "grey", margin: "32px" }}>-- {t("no upcoming reservations")} --</Typography>
        }
      </CardContent>
      <Divider />
      <CardActions sx={{justifyContent: "flex-end"}}>
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
