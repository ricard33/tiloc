import React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";

import { useTranslation } from "react-i18next";
import { formatDate, formatDistanceToNow } from "../../../common/dateUtils";
import { NavLink } from "react-router-dom";
import { useListBookingsQuery } from "../../../services/api";

type Props = {
  className?: string
}

const LatestBookings: React.FC<Props> = props => {
  const { className, ...rest } = props;

  const { t } = useTranslation();
  const count = 3;
  const { data: bookings } = useListBookingsQuery({
    cancelled: false,
    ordering: "-created",
    page_size: count
  });

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
        title={t("Latest bookings")}
      />
      <Divider />
      <CardContent sx={{ padding: 0 }}>
        <List>
          {bookings && bookings.map((booking, i) => (
            <ListItem
              sx={{ paddingTop: 0, paddingBottom: 0 }}
              divider={i < count - 1}
              key={booking.id}
            >
              <ListItemText
                primary={booking.guest_name}
                secondary={t("{{ duration }} nights - {{ count }} guests",
                  { duration: booking.duration, count: booking.adults + booking.children + booking.babies })}
              />
              <ListItemText
                secondary={formatDate(booking.begin_date, "PPP") + " - "
                  + formatDate(booking.end_date, "PPP")}
              />
              <ListItemText
                primary={Number(booking.price).toLocaleString() + " €"}
                secondary={formatDistanceToNow(booking.created)}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: "flex-end" }}>
        <Button
          component={NavLink}
          color="primary"
          size="small"
          variant="text"
          to="/planning"
        >
          {t("View all")} <ArrowRightIcon />
        </Button>
      </CardActions>
    </Card>
  );
};

export default LatestBookings;
