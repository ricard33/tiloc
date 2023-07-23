import React from "react";
import { Route, Routes } from "react-router-dom";

import { Main as MainLayout, Minimal as MinimalLayout } from "./layouts";

import {
  BookingList,
  ContractEdit,
  ContractTemplateEdit,
  Dashboard as DashboardView,
  LoggedOut,
  NotFound as NotFoundView,
  Settings,
  SignIn,
  TestPage
} from "./views";
import { RequireAuth } from "./components/RequireAuth";
import LodgingsList from "./views/Lodging/LodgingList";
import OwnersList from "./views/Owner/OwnersList";
import BookingStatusesList from "./views/BookingStatus/BookingStatusesList";
import ServicesList from "./views/Services/ServicesList";
import { LodgingPage } from "./views/Lodging/LodgingPage";
import { OwnerPage } from "./views/Owner/OwnerPage";
import { BookingStatusPage } from "./views/BookingStatus/BookingStatusPage";
import { ServicePage } from "./views/Services/ServicePage";
import ContractTemplateList from "./views/ContractTemplate/ContractTemplateList";
import CalendarSyncsList from "./views/CalendarSync/CalendarSyncsList";
import CalendarSyncPage from "./views/CalendarSync/CalendarSyncPage";
import { BookingChannelPage } from "./views/BookingChannel/BookingChannelPage";
import BookingChannelList from "./views/BookingChannel/BookingChannelList";
import PaymentsList from "./views/Payment/PaymentsList";

const PlanningView = React.lazy(() => import("./views/Planning"));
const GuestsList = React.lazy(() => import("./views/Guests/GuestsList"));

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
          <Route
            path="/planning/*"
            element={
              <React.Suspense fallback={<>...</>}>
                <PlanningView />
              </React.Suspense>
            }
          />
          <Route path="/bookings/*" element={<BookingList />} />
          <Route path="/bookings/:bookingId/contract" element={<ContractEdit />} />
          <Route path="/payments" element={<PaymentsList />} />
          <Route path="/reports" element={<TestPage />} />
          <Route
            path="/guests"
            element={
              <React.Suspense fallback={<>...</>}>
                <GuestsList />
              </React.Suspense>
            }
          />
          <Route path="/settings/" element={<Settings />} />
          <Route path="/settings/owners" element={<OwnersList />} />
          <Route path="/settings/owners/new" element={<OwnerPage />} />
          <Route path="/settings/owners/:ownerId" element={<OwnerPage />} />
          <Route path="/settings/lodgings" element={<LodgingsList />} />
          <Route path="/settings/lodgings/new" element={<LodgingPage />} />
          <Route path="/settings/lodgings/:lodgingId" element={<LodgingPage />} />
          <Route path="/settings/booking-status" element={<BookingStatusesList />} />
          <Route path="/settings/booking-status/new" element={<BookingStatusPage />} />
          <Route path="/settings/booking-status/:bookingStatusId" element={<BookingStatusPage />} />
          <Route path="/settings/booking-channels" element={<BookingChannelList />} />
          <Route path="/settings/booking-channels/new" element={<BookingChannelPage />} />
          <Route path="/settings/booking-channels/:bookingChannelId" element={<BookingChannelPage />} />
          <Route path="/settings/services" element={<ServicesList />} />
          <Route path="/settings/services/new" element={<ServicePage />} />
          <Route path="/settings/services/:serviceId" element={<ServicePage />} />
          <Route path="/settings/contract-templates" element={<ContractTemplateList />} />
          <Route path="/settings/contract-templates/new" element={<ContractTemplateEdit />} />
          <Route path="/settings/contract-templates/:templateId" element={<ContractTemplateEdit />} />
          <Route path="/settings/calendar-syncs" element={<CalendarSyncsList />} />
          <Route path="/settings/calendar-syncs/new" element={<CalendarSyncPage />} />
          <Route path="/settings/calendar-syncs/:calendarSyncId" element={<CalendarSyncPage />} />
          <Route path="/test-page" element={<TestPage />} />
          <Route path="*" element={<NotFoundView />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default MyRoutes;
