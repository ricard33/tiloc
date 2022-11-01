import React from "react";
import { Grid } from "@mui/material";

import { ChannelsDistribution, FillingRate, LatestBookings, NextEvents } from "./components";
import Page from "../../layouts/Main/Page";

const Dashboard = () => {

  return (
    <Page>
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
    </Page>
  );
};

export default Dashboard;
