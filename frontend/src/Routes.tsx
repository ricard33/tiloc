import React from "react";
import { Redirect, Switch } from "react-router-dom";

import { RouteWithLayout } from "./components";
import { Main as MainLayout, Minimal as MinimalLayout } from "./layouts";

import {
  BookingList as BookingView,
  ContractEdit,
  Dashboard as DashboardView,
  NotFound as NotFoundView,
  Planning as PlanningView,
  SignIn,
  LoggedOut,
  TestPage,
  Settings,
  ContractTemplateList,
  ContractTemplateEdit,
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
        component={SignIn}
        exact
        layout={MinimalLayout}
        needAuthentication={false}
        path="/login"
      />
      <RouteWithLayout
        component={LoggedOut}
        exact
        layout={MinimalLayout}
        needAuthentication={false}
        path="/logged-out"
      />
      <RouteWithLayout
        component={DashboardView}
        exact
        layout={MainLayout}
        path="/dashboard"
      />
      <RouteWithLayout
        component={PlanningView}
        exact
        layout={MainLayout}
        path="/planning"
      />
      <RouteWithLayout
        component={BookingView}
        exact
        layout={MainLayout}
        path="/bookings"
      />
      <RouteWithLayout
        component={ContractEdit}
        exact
        layout={MainLayout}
        path="/bookings/:bookingId/contract"
      />
      <RouteWithLayout
        component={Settings}
        exact
        layout={MainLayout}
        path="/settings/"
      />
      <RouteWithLayout
        component={ContractTemplateList}
        exact
        layout={MainLayout}
        path="/settings/contract-templates"
      />
      <RouteWithLayout
        component={ContractTemplateEdit}
        exact
        layout={MainLayout}
        path="/settings/contract-templates/:templateId"
      />
      <RouteWithLayout
        component={TestPage}
        exact
        layout={MainLayout}
        path="/test-page"
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
