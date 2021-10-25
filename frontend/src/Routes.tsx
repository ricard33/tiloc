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
        layout={MinimalLayout}
        needAuthentication={false}
        path="/login"
      />
      <RouteWithLayout
        component={LoggedOut}
        layout={MinimalLayout}
        needAuthentication={false}
        path="/logged-out"
      />
      <RouteWithLayout
        component={DashboardView}
        layout={MainLayout}
        path="/dashboard"
      />
      <RouteWithLayout
        component={PlanningView}
        layout={MainLayout}
        path="/planning"
      />
      <RouteWithLayout
        component={BookingView}
        layout={MainLayout}
        path="/bookings"
      />
      <RouteWithLayout
        component={ContractEdit}
        layout={MainLayout}
        path="/bookings/:bookingId/contract"
      />
      <RouteWithLayout
        component={Settings}
        layout={MainLayout}
        path="/settings/"
      />
      <RouteWithLayout
        component={ContractTemplateList}
        layout={MainLayout}
        path="/settings/contract-templates"
      />
      <RouteWithLayout
        component={ContractTemplateEdit}
        layout={MainLayout}
        path="/settings/contract-templates/:templateId"
      />
      <RouteWithLayout
        component={TestPage}
        layout={MainLayout}
        path="/test-page"
      />
      <RouteWithLayout
        component={NotFoundView}
        layout={MinimalLayout}
        path="/not-found"
      />
      <Redirect to="/not-found"/>
    </Switch>
  );
};

export default Routes;
