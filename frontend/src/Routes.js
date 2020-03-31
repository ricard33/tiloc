import React from "react";
import { Redirect, Switch } from "react-router-dom";

import { RouteWithLayout } from "./components";
import { Main as MainLayout, Minimal as MinimalLayout } from "./layouts";

import {
  BookingEdit,
  BookingList as BookingView,
  Dashboard as DashboardView,
  SignIn,
  NotFound as NotFoundView
} from "./views";

const Routes = () => {
  return (
    <Switch>
      <Redirect
        exact
        from="/"
        to="/dashboard"
      />
      <RouteWithLayout
        component={SignIn} exact layout={MinimalLayout}
        needAuthentication={false}
        path="/login"
      />
      <RouteWithLayout
        component={DashboardView}
        exact
        layout={MainLayout}
        path="/dashboard"
      />
      <RouteWithLayout
        component={BookingView}
        exact
        layout={MainLayout}
        path="/bookings"
      />
      <RouteWithLayout
        component={BookingEdit}
        exact
        layout={MainLayout}
        path="/bookings/:id"
      />
      <RouteWithLayout
        component={NotFoundView}
        exact
        layout={MinimalLayout}
        path="/not-found"
      />
      <Redirect to="/not-found"/>
    </Switch>
  );
};

export default Routes;
