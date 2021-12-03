import React from 'react';
import { makeStyles } from '@mui/styles';
import { Grid } from '@mui/material';

import {
  // Budget,
  // TotalUsers,
  // TasksProgress,
  // TotalProfit,
  FillingRate,
  ChannelsDistribution,
  LatestBookings,
  NextEvents
} from './components';

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  }
}));

const Dashboard = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Grid
        container
        spacing={4}
      >
        <Grid
          item
          xl={9}
          lg={8}
          md={12}
          xs={12}
        >
          <NextEvents />
        </Grid>
        <Grid
          item
          xl={3}
          lg={4}
          md={12}
          sm={12}
          xs={12}
        >
          <LatestBookings />
        </Grid>
        {/*<Grid*/}
        {/*  item*/}
        {/*  lg={3}*/}
        {/*  sm={6}*/}
        {/*  xl={3}*/}
        {/*  xs={12}*/}
        {/*>*/}
        {/*  <TotalUsers />*/}
        {/*</Grid>*/}
        {/*<Grid*/}
        {/*  item*/}
        {/*  lg={3}*/}
        {/*  sm={6}*/}
        {/*  xl={3}*/}
        {/*  xs={12}*/}
        {/*>*/}
        {/*  <TasksProgress />*/}
        {/*</Grid>*/}
        {/*<Grid*/}
        {/*  item*/}
        {/*  lg={3}*/}
        {/*  sm={6}*/}
        {/*  xl={3}*/}
        {/*  xs={12}*/}
        {/*>*/}
        {/*  <TotalProfit />*/}
        {/*</Grid>*/}
        <Grid
          item
          lg={8}
          md={12}
          xl={9}
          xs={12}
        >
          <FillingRate />
        </Grid>
        <Grid
          item
          lg={4}
          md={6}
          xl={3}
          xs={12}
        >
          <ChannelsDistribution />
        </Grid>

        {/*<Grid*/}
        {/*  item*/}
        {/*  lg={8}*/}
        {/*  md={12}*/}
        {/*  xl={9}*/}
        {/*  xs={12}*/}
        {/*>*/}
        {/*  <LatestBookings />*/}
        {/*</Grid>*/}
      </Grid>
    </div>
  );
};

export default Dashboard;
