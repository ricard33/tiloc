import React from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles } from '@mui/styles';
import {
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Button,
  Divider,
  List, ListItem, ListItemText
} from "@mui/material";
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import { useTranslation } from "react-i18next";
import { formatDate, formatDistanceToNow } from "../../../../common/dateUtils";
import { NavLink } from "react-router-dom";
import { useListBookingsQuery } from "../../../../services/api";

const useStyles = makeStyles(theme => ({
  root: {},
  content: {
    padding: 0
  },
  inner: {
    minWidth: 800
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  status: {
    marginRight: theme.spacing(1)
  },
  actions: {
    justifyContent: 'flex-end'
  },
  listItem: {
    paddingTop: 0,
    paddingBottom: 0
  }
}));

const LatestBookings = props => {
  const { className, ...rest } = props;

  const classes = useStyles();
  const { t } = useTranslation();
  const count = 3;
  const { data: bookings } = useListBookingsQuery({
    lodging__isnull: false,
    ordering: "-created",
    page_size: count
  });

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
        //     New entry
        //   </Button>
        // }
        title={t("Latest bookings")}
      />
      <Divider />
      <CardContent className={classes.content}>
        <List>
          {bookings && bookings.map((booking, i) => (
            <ListItem
              className={classes.listItem}
              divider={i < count - 1}
              key={booking.id}
            >
              <ListItemText
                primary={booking.guest_name}
                secondary={t("{{ duration }} nights - {{ count }} guests",
                  {duration: booking.duration, count: booking.adults + booking.children + booking.babies})}
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
      <CardActions className={classes.actions}>
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

LatestBookings.propTypes = {
  className: PropTypes.string
};

export default LatestBookings;
