import React from 'react';
import clsx from 'clsx';
import { parse, parseISO } from 'date-fns';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import {
  Card,
  CardActions,
  CardHeader,
  CardContent,
  Button,
  Divider,
  List, ListItem, ListItemText
} from "@material-ui/core";
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import { useSelector } from "react-redux";
import * as selectors from "../../../../selectors";
import { useTranslation } from "react-i18next";
import { formatDate, formatDistanceToNow } from "../../../../common/dateUtils";
import { NavLink } from "react-router-dom";

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
  const bookings = useSelector(store =>  selectors.lastBookings(store));
  const count = 3;

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
          {bookings.slice(0, count).map((booking, i) => (
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
                secondary={formatDate(parse(booking.begin_date, "yyyy-MM-dd", new Date()), "PPP") + " - "
                + formatDate(parse(booking.end_date, "yyyy-MM-dd", new Date()), "PPP")}
              />
              <ListItemText
                primary={Number(booking.price).toLocaleString() + " €"}
                secondary={formatDistanceToNow(parseISO(booking.created))}
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
