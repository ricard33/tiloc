import React, { useCallback, useEffect } from "react";
import { Navigate, Route, Routes, Location, useLocation } from "react-router-dom";

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
import ServicesList from "./views/Services/ServicesList";
import { LodgingPage } from "./views/Lodging/LodgingPage";
import { ServicePage } from "./views/Services/ServicePage";
import ContractTemplateList from "./views/ContractTemplate/ContractTemplateList";
import CalendarSyncsList from "./views/CalendarSync/CalendarSyncsList";
import CalendarSyncPage from "./views/CalendarSync/CalendarSyncPage";
import { BookingChannelPage } from "./views/BookingChannel/BookingChannelPage";
import BookingChannelList from "./views/BookingChannel/BookingChannelList";
import PaymentsList from "./views/Payment/PaymentsList";
import UsersList from "./views/Users/UsersList";
import { UserPage } from "./views/Users/UserPage";
import { SignUp } from "./views/SignUp/SignUp";
import NewAccountWizard from "./views/Wizards/NewAccountWizard";
import SettingsIndex from "./views/Settings/SettingsIndex";
import { MyProfile } from "./views/Users/MyProfile";
import { EmailVerified } from "./views/SignUp/EmailVerified";
import Subscription from "./views/Subscription/Subscription";
import PricingTable from "./views/Subscription/PricingTable";
import Checkout from "./views/Subscription/Checkout";
import CheckoutDone from "./views/Subscription/CheckoutDone";
import MyAccount from "./views/Subscription/Acccount";
import SubscriptionCancel from "./views/Subscription/SubscriptionCancel";
import ForgottenPassword from "./views/SignIn/ForgottenPassword";
import logger from "./common/logger";
import { useAppSelector } from "./app/hooks";
import { User } from "./types";

const PlanningView = React.lazy(() => import("./views/Planning"));
const GuestsList = React.lazy(() => import("./views/Guests/GuestsList"));

const MyRoutes = () => {
  const currentUser = useAppSelector(store => store.auth.user) as User;
  const location = useLocation();

  const trackPageView = useCallback((_location: Location) => {
    console.log(window.location.toString());
    logger.info({
      message: `Nav to ${window.location.toString()}`,
      user: currentUser && currentUser.email,
    }, true);
  }, [currentUser]);

  useEffect(() => {
    trackPageView(location);
  }, [location, trackPageView]);

  return (
    <Routes>
      <Route element={<MinimalLayout />}>
        <Route path="/login" element={<SignIn />} />
        <Route path="/logged-out" element={<LoggedOut />} />
        <Route path="/not-found" element={<NotFoundView />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/email-verified" element={<EmailVerified />} />
        <Route path="/reset-password" element={<ForgottenPassword />} />
        {/*<Route path="*" element={<NotFoundView />} />*/}
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<MinimalLayout />}>
          <Route path="/setup" element={<NewAccountWizard />} />
        </Route>
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
          <Route path="account" element={<MyAccount />}>
            <Route index element={<MyProfile />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="cancel" element={<SubscriptionCancel />} />
            <Route path="prices" element={<PricingTable />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout-done" element={<CheckoutDone />} />

          </Route>
          <Route path="/settings/" element={<Settings />}>
            <Route index element={<SettingsIndex />} />
            <Route path="users" element={<UsersList />} />
            <Route path="users/new" element={<UserPage />} />
            <Route path="users/:userId" element={<UserPage />} />
            <Route path="lodgings" element={<LodgingsList />} />
            <Route path="lodgings/new" element={<LodgingPage />} />
            <Route path="lodgings/:lodgingId" element={<LodgingPage />} />
            <Route path="booking-channels" element={<BookingChannelList />} />
            <Route path="booking-channels/new" element={<BookingChannelPage />} />
            <Route path="booking-channels/:bookingChannelId" element={<BookingChannelPage />} />
            <Route path="services" element={<ServicesList />} />
            <Route path="services/new" element={<ServicePage />} />
            <Route path="services/:serviceId" element={<ServicePage />} />
            <Route path="contract-templates" element={<ContractTemplateList />} />
            <Route path="contract-templates/new" element={<ContractTemplateEdit />} />
            <Route path="contract-templates/:templateId" element={<ContractTemplateEdit />} />
            <Route path="calendar-syncs" element={<CalendarSyncsList />} />
            <Route path="calendar-syncs/new" element={<CalendarSyncPage />} />
            <Route path="calendar-syncs/:calendarSyncId" element={<CalendarSyncPage />} />
          </Route>
          <Route path="/upgrade-plan" element={<Navigate to="/account/prices" replace />} />
          <Route path="/test-page" element={<TestPage />} />
          <Route path="*" element={<NotFoundView />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default MyRoutes;
