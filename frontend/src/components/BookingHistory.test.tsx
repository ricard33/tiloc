import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@mui/material/styles";
import axios from "axios";

import i18n from "../i18n";
import theme from "../theme";
import { api } from "../services/api";
import { auth as authReducer } from "../reducers";
import type { Booking, User } from "../types";
import BookingHistory from "./BookingHistory";

vi.mock("axios");

const booking = { id: 22 } as Booking;

const historyPayload = [
  {
    history_id: 3,
    date: "2026-08-30T14:23:00Z",
    type: "~",
    type_label: "changed",
    user: { id: 1, full_name: "Alice Martin", email: "alice@example.com" },
    changes: [
      { field: "status", old: "option", new: "paid" },
      { field: "begin_date", old: "2026-01-10", new: "2026-01-12" }
    ]
  },
  {
    history_id: 2,
    date: "2026-08-29T09:00:00Z",
    type: "~",
    type_label: "changed",
    user: null,
    changes: [{ field: "notes", old: null, new: "synced" }]
  },
  {
    history_id: 1,
    date: "2026-08-01T08:00:00Z",
    type: "+",
    type_label: "created",
    user: { id: 1, full_name: "Alice Martin", email: "alice@example.com" },
    changes: []
  }
];

function makeUser(permissions: string[]): User {
  return { id: 1, full_name: "Alice Martin", email: "alice@example.com", permissions } as User;
}

function renderHistory(permissions: string[] = ["core.view_historicalbooking"]) {
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
          <BookingHistory booking={booking} />
        </ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
}

beforeAll(async () => {
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  (axios as any).mockImplementation(async () => ({ data: historyPayload, status: 200 }));
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("BookingHistory", () => {
  test("renders one timeline item per history entry with author and change detail", async () => {
    renderHistory();

    const items = await screen.findAllByRole("listitem");
    expect(items).toHaveLength(historyPayload.length);

    expect(screen.getAllByText(/Alice Martin/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Booking status:.*→/)).toBeInTheDocument();
    expect(screen.getByText("Booking created")).toBeInTheDocument();
  });

  test("falls back to a system label when the entry has no user", async () => {
    renderHistory();

    expect(await screen.findByText(/Automatic synchronization/)).toBeInTheDocument();
  });

  test("shows an empty state when there is no history", async () => {
    (axios as any).mockImplementation(async () => ({ data: [], status: 200 }));
    renderHistory();

    expect(await screen.findByText("No modifications recorded")).toBeInTheDocument();
  });

  test("renders nothing without the view_historicalbooking permission", () => {
    const { container } = renderHistory([]);
    expect(container).toBeEmptyDOMElement();
  });
});
