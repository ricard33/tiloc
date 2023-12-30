import { Navigate, Outlet, useLocation } from "react-router-dom";
import React from "react";
import { useAppSelector } from "../app/hooks";
import { AuthState } from "../reducers/auth";

export function RequireAuth() {
  const auth = useAppSelector(store => store.auth) as AuthState;
  const location = useLocation();
  if (!auth.isAuthenticated && auth.isLoading) {
    return <em>Loading...</em>;
  } else if (!auth.isAuthenticated) {
    return <Navigate to={"/login"} state={{ from: location }} replace />;
  } else if (auth.account && !auth.account.is_initialized && location.pathname !== "/setup") {
    return <Navigate to={"/setup"} replace />;
  } else {
    return (
      <Outlet />
    );
  }
}
