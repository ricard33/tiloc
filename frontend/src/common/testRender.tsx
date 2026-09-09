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
  /** initial URL(s) for the in-memory router */
  route?: string;
  /** the authenticated user (sets auth.isAuthenticated + user.permissions) */
  user?: Partial<User> | null;
  /** anything to merge into the preloaded redux state */
  preloadedState?: Record<string, unknown>;
  /** stand-in for useConfirm(): resolve to accept, reject to dismiss. Defaults to auto-accept. */
  confirm?: (options?: unknown) => Promise<unknown>;
}

export function makeTestStore(user?: Partial<User> | null, preloadedState: Record<string, unknown> = {}) {
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
      },
      ...preloadedState,
    } as never,
  });
}

/** Render `ui` wrapped in every provider the app relies on (redux, router, i18n, MUI theme, date pickers, snackbar). */
export function renderWithProviders(ui: ReactElement, options: Options = {}) {
  const { route = "/", user, preloadedState, confirm = () => Promise.resolve(), ...renderOptions } = options;
  const store = makeTestStore(user, preloadedState);

  const Wrapper = ({ children }: PropsWithChildren) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider theme={theme}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <SnackbarProvider>
                <ConfirmContext.Provider value={confirm}>{children}</ConfirmContext.Provider>
              </SnackbarProvider>
            </LocalizationProvider>
          </ThemeProvider>
        </I18nextProvider>
      </MemoryRouter>
    </Provider>
  );

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
