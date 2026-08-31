import React from "react";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@mui/material/styles";

import i18n from "../i18n";
import theme from "../theme";
import { api } from "../services/api";
import { auth as authReducer } from "../reducers";
import type { Booking, User } from "../types";
import BookingHistorySummary from "./BookingHistorySummary";

vi.mock("./BookingHistory", () => ({
  default: () => <div data-testid="history-stub">BookingHistory</div>
}));

const booking = {
  id: 22,
  created: new Date("2026-01-05T09:30:00Z"),
  modified: new Date("2026-08-20T16:45:00Z")
} as Booking;

function makeUser(permissions: string[]): User {
  return { id: 1, full_name: "Alice Martin", email: "alice@example.com", permissions } as User;
}

function renderSummary(permissions: string[]) {
  const store = configureStore({
    reducer: combineReducers({ [api.reducerPath]: api.reducer, auth: authReducer }),
    middleware: (gdm) => gdm({ serializableCheck: false, immutableCheck: false }).concat(api.middleware),
    preloadedState: {
      auth: { isAuthenticated: true, isLoading: false, needToReload: false, user: makeUser(permissions) }
    } as any
  });
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <BookingHistorySummary booking={booking} />
        </ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("BookingHistorySummary", () => {
  test("always shows the creation and last-modification dates", () => {
    renderSummary(["core.view_historicalbooking"]);

    expect(screen.getByText(/^Created on /)).toBeInTheDocument();
    expect(screen.getByText(/^Last modified on /)).toBeInTheDocument();
  });

  test("hides the expand control without the view_historicalbooking permission", () => {
    renderSummary([]);

    expect(screen.queryByRole("button", { name: /Show full history/ })).not.toBeInTheDocument();
    expect(screen.queryByTestId("history-stub")).not.toBeInTheDocument();
  });

  test("toggles the full history on click when the user may view it", async () => {
    const uiUser = userEvent.setup();
    renderSummary(["core.view_historicalbooking"]);

    const toggle = screen.getByRole("button", { name: /Show full history/ });
    expect(screen.queryByTestId("history-stub")).not.toBeInTheDocument();

    await uiUser.click(toggle);
    expect(screen.getByTestId("history-stub")).toBeInTheDocument();

    await uiUser.click(toggle);
    expect(screen.queryByTestId("history-stub")).not.toBeInTheDocument();
  });
});
