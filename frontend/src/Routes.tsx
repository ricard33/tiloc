import React from "react";
import { Route, Routes } from "react-router-dom";

import { Main as MainLayout, Minimal as MinimalLayout } from "./layouts";

import {
  BookingList as BookingView,
  ContractEdit,
  ContractTemplateEdit,
  ContractTemplateList,
  Dashboard as DashboardView,
  LoggedOut,
  NotFound as NotFoundView,
  Planning as PlanningView,
  Settings,
  SignIn,
  TestPage
} from "./views";
import { RequireAuth } from "./components/RequireAuth";
import LodgingsList from "./views/Lodging/LodgingList";
import { LodgingForm } from "./views/Lodging/LodgingForm";

const MyRoutes = () => {
  return (
    <Routes>
      <Route element={<MinimalLayout />}>
        <Route path="/login" element={<SignIn />} />
        <Route path="/logged-out" element={<LoggedOut />} />
        <Route path="/not-found" element={<NotFoundView />} />
        {/*<Route path="*" element={<NotFoundView />} />*/}
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<MainLayout />}>
          {/*<Route path="/" element={<Navigate to={"/dashboard"} replace />} />*/}
          {/*<Route path="/dashboard" element={<DashboardView />} />*/}
          <Route index element={<DashboardView />} />
          <Route path="/planning" element={<PlanningView />} />
          <Route path="/bookings" element={<BookingView />} />
          <Route path="/bookings/:bookingId/contract" element={<ContractEdit />} />
          <Route path="/reports" element={<TestPage />} />
          <Route path="/settings/" element={<Settings />} />
          <Route path="/settings/lodgings" element={<LodgingsList />} />
          <Route path="/settings/lodgings/:lodgingId" element={<LodgingForm />} />
          <Route path="/settings/contract-templates" element={<ContractTemplateList />} />
          <Route path="/settings/contract-templates/:templateId" element={<ContractTemplateEdit />} />
          <Route path="/test-page" element={<TestPage />} />
          <Route path="*" element={<NotFoundView />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default MyRoutes;
