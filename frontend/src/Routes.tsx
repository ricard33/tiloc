import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

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
  ContractTemplateEdit
} from "./views";
import { useSelector } from "react-redux";
import { RootState } from "./store";

const MyRoutes = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={"/dashboard"} replace />}
      />
      <Route
        path="/login" element={
          <MinimalLayout>
            <SignIn />
          </MinimalLayout>
        }
      />
      <Route
        path="/logged-out" element={
          <MinimalLayout>
            <LoggedOut />
          </MinimalLayout>
        }
      />
      <Route
        path="/dashboard" element={
          <RequireAuth>
            <MainLayout>
              <DashboardView />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/planning" element={
          <RequireAuth>
            <MainLayout>
              <PlanningView />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/bookings" element={
          <RequireAuth>
            <MainLayout>
              <BookingView />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/bookings/:bookingId/contract" element={
          <RequireAuth>
            <MainLayout>
              <ContractEdit />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/" element={
          <RequireAuth>
            <MainLayout>
              <Settings />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/contract-templates" element={
          <RequireAuth>
            <MainLayout>
              <ContractTemplateList />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/contract-templates/:templateId" element={
          <RequireAuth>
            <MainLayout>
              <ContractTemplateEdit />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/test-page" element={
          <RequireAuth>
            <MainLayout>
              <TestPage />
            </MainLayout>
          </RequireAuth>
        }
      />
      <Route
        path="/not-found" element={
          <MinimalLayout>
            <NotFoundView />
          </MinimalLayout>
        }
      />
      <Route
        path="*" element={
          <MinimalLayout>
            <NotFoundView />
          </MinimalLayout>
        }
      />
    </Routes>
  );
};

function RequireAuth({ children }: { children: JSX.Element }) {
  const auth = useSelector<RootState>(store => store.auth) as { isLoading: boolean, isAuthenticated: boolean };
  const location = useLocation();
  if (auth.isLoading) {
    return <em>Loading...</em>;
  } else if (!auth.isAuthenticated) {
    return <Navigate to={"/login"} state={{ from: location }} replace />;
  } else {
    return (
      children
    );
  }
}

export default MyRoutes;
