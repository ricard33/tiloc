import React from 'react';
import clsx from 'clsx';
import moment from 'moment';
import PerfectScrollbar from 'react-perfect-scrollbar';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
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
  TableSortLabel
} from "@material-ui/core";
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import { StatusBullet } from 'components';
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import * as selectors from "../../../../selectors";
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
  }
}));

const statusColors = {
  CHECKOUT: 'success',
  CHECKIN: 'danger'
};

const NextEvents = props => {
  const { className, ...rest } = props;
  const classes = useStyles();
  const { t } = useTranslation();
  const events = useSelector(store => selectors.nextEvents(store));

  console.log(events);

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
          <div className={classes.inner}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sortDirection="desc">
                    <Tooltip
                      enterDelay={300}
                      title="Sort"
                    >
                      <TableSortLabel
                        active
                        direction="desc"
                      >
                        Date
                      </TableSortLabel>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{t("Lodging")}</TableCell>
                  <TableCell>{t("Type")}</TableCell>
                  <TableCell>{t("Guest")}</TableCell>
                  <TableCell>{t("Booking channel")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {events.slice(0, 5).map(event => (
                  <TableRow
                    hover
                    key={event.event_type + event.id}
                  >
                    <TableCell>
                      {moment(event.date).format('LL')}
                    </TableCell>
                    <TableCell>{event.lodging ? event.lodging.name : "-"}</TableCell>
                    <TableCell>
                      <div className={classes.statusContainer}>
                        <StatusBullet
                          className={classes.status}
                          color={statusColors[event.event_type]}
                          size="sm"
                        />
                        {{ CHECKIN: t("arrival"), CHECKOUT: t("departure") }[event.event_type]}
                      </div>
                    </TableCell>
                    <TableCell>{event.guest_name}</TableCell>
                    <TableCell>{event.source ? event.source.name : "-"}</TableCell>
                    {/*<TableCell>*/}
                    {/*  <div className={classes.statusContainer}>*/}
                    {/*    <StatusBullet*/}
                    {/*      className={classes.status}*/}
                    {/*      color={statusColors[order.status]}*/}
                    {/*      size="sm"*/}
                    {/*    />*/}
                    {/*    {order.status}*/}
                    {/*  </div>*/}
                    {/*</TableCell>*/}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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

NextEvents.propTypes = {
  className: PropTypes.string
};

export default NextEvents;
