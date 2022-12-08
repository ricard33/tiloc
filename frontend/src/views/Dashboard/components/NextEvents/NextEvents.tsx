import React from 'react';
import clsx from 'clsx';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { makeStyles } from '@mui/styles';
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
import ArrowRightIcon from '@mui/icons-material/ArrowRight';

import { StatusBullet } from '../../../../components';
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { useNextEventsQuery } from "../../../../services/api";
import { formatDate } from "../../../../common/dateUtils";
import { parseISO } from "date-fns";

const useStyles = makeStyles((theme: Theme) => ({
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
                {events && events.map(event => (
                  <TableRow
                    hover
                    key={event.event_type + event.id}
                  >
                    <TableCell>
                      {formatDate(parseISO(event.date), 'PP')}
                    </TableCell>
                    <TableCell>{event.lodging_name}</TableCell>
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
                    <TableCell>{event.booking_channel ?? "-"}</TableCell>
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

export default NextEvents;
