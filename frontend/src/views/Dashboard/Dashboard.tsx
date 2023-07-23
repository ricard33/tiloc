import React, { Suspense } from "react";
import { Grid } from "@mui/material";

import LatestBookings from "./components/LatestBookings";
import NextEvents from "./components/NextEvents";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";

const ChannelsDistribution = React.lazy(() => import("./components/ChannelsDistribution"));
const FillingRate = React.lazy(() => import("./components/FillingRate"));

const Dashboard = () => {
  const { t } = useTranslation();
  return (
    <Page>
      <Grid container spacing={4}>
        <Grid item xl={9} lg={8} md={12} xs={12}>
          <NextEvents />
        </Grid>
        <Grid item xl={3} lg={4} md={12} sm={12} xs={12}>
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
        <Grid item lg={8} md={12} xl={9} xs={12}>
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            <FillingRate />
          </Suspense>
        </Grid>
        <Grid item lg={4} md={6} xl={3} xs={12}>
          <Suspense fallback={<div>{t("Loading...")}</div>}>
            <ChannelsDistribution />
          </Suspense>
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
