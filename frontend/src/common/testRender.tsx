import React, { PropsWithChildren, ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { SnackbarProvider } from "notistack";
import ConfirmContext from "../libs/MuiConfirm/ConfirmContext";

import i18n from "../i18n";
import theme from "../theme";
import { api } from "../services/api";
import { alert as alertReducer, appInfo as appInfoReducer, auth as authReducer } from "../reducers";
import type { User } from "../types";

interface Options extends Omit<RenderOptions, "wrapper"> {
  /** initial URL(s) for the in-memory router; pass an array to give the history a "back" entry.
   *  Entries may be `{ pathname, state }` objects to seed `location.state`. */
  route?: string | Array<string | { pathname: string; state?: unknown }>;
  /** the authenticated user (sets auth.isAuthenticated + user.permissions) */
  user?: Partial<User> | null;
  /** the user's account (auth.account) */
  account?: Record<string, unknown>;
  /** anything to merge into the preloaded redux state */
  preloadedState?: Record<string, unknown>;
  /** stand-in for useConfirm(): resolve to accept, reject to dismiss. Defaults to auto-accept. */
  confirm?: (options?: unknown) => Promise<unknown>;
  /** set false when the component under test renders its own <Router> (e.g. <App/>) */
  router?: boolean;
}

export function makeTestStore(
  user?: Partial<User> | null,
  preloadedState: Record<string, unknown> = {},
  account?: Record<string, unknown>
) {
  return configureStore({
    reducer: combineReducers({
      alert: alertReducer,
      auth: authReducer,
      appInfo: appInfoReducer,
      [api.reducerPath]: api.reducer,
    }),
    middleware: (gdm) => gdm({ serializableCheck: false, immutableCheck: false }).concat(api.middleware),
    preloadedState: {
      auth: {
        isAuthenticated: !!user,
        isLoading: false,
        needToReload: false,
        user: user ? ({ id: 1, email: "test@example.com", permissions: [], ...user } as User) : undefined,
        account,
      },
      ...preloadedState,
    } as never,
  });
}

/** Render `ui` wrapped in every provider the app relies on (redux, router, i18n, MUI theme, date pickers, snackbar). */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const {
    route = "/",
    user,
    account,
    preloadedState,
    confirm = () => Promise.resolve(),
    router = true,
    ...renderOptions
  } = options;
  const entries = Array.isArray(route) ? route : [route];
  const store = makeTestStore(user, preloadedState, account);

  const withRouter = (children: React.ReactNode) =>
    router ? (
      <MemoryRouter initialEntries={entries as never} initialIndex={entries.length - 1}>
        {children}
      </MemoryRouter>
    ) : (
      children
    );

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      {withRouter(
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <SnackbarProvider>
                <ConfirmContext.Provider value={confirm}>{children}</ConfirmContext.Provider>
              </SnackbarProvider>
            </LocalizationProvider>
          </ThemeProvider>
        </I18nextProvider>
      )}
    </Provider>
  );

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
