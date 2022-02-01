import { useSelector } from "react-redux";
import { RootState } from "../store";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import React from "react";

export function RequireAuth() {
  const auth = useSelector<RootState>(store => store.auth) as { isLoading: boolean, isAuthenticated: boolean };
  const location = useLocation();
  if (auth.isLoading) {
    return <em>Loading...</em>;
  } else if (!auth.isAuthenticated) {
    return <Navigate to={"/login"} state={{ from: location }} replace />;
  } else {
    return (
      <Outlet />
    );
  }
}
