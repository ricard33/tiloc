import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { SnackbarProvider } from "notistack";
import frLocale from "date-fns/locale/fr";
import axios from "axios";

import i18n from "../../i18n";
import theme from "../../theme";
import { api } from "../../services/api";
import { alert as alertReducer, appInfo as appInfoReducer, auth as authReducer } from "../../reducers";
import type { Account, Booking, Lodging, Service, User } from "../../types";
import BookingDialog from "./BookingDialog";

// --- Mock the heavy / side-effecting collaborators so we can test BookingDialog in isolation ---

vi.mock("axios");

vi.mock("../../common/formUtils", () => ({
  usePageUnloadAlert: () => {}
}));

vi.mock("../../common/dialogs", () => ({
  useUnsavedChangesConfirm: () => () => Promise.resolve()
}));

vi.mock("../BookingActions", () => ({
  default: (props: any) => (
    <div>
      <button type="button" onClick={() => props.onSave(true)}>MockSave</button>
      <button type="button" onClick={() => props.onReset()}>MockReset</button>
    </div>
  )
}));

vi.mock("../Payments", () => ({
  default: () => <div data-testid="payments-stub">Payments</div>
}));

vi.mock("../Comments", () => ({
  default: () => <div data-testid="comments-stub">Comments</div>
}));

vi.mock("./OptionsList", () => ({
  default: () => <div data-testid="options-stub">OptionsList</div>
}));

vi.mock("../BookingHistory", () => ({
  default: () => <div data-testid="history-stub">BookingHistory</div>
}));

// --- Fixtures ---

const makeLodging = (overrides: Partial<Lodging> = {}): Lodging => ({
  id: 1,
  active: true,
  shown: true,
  name: "Villa Test",
  owner_id: 1,
  owner: { id: 1, full_name: "Owner", email: "owner@example.com" },
  rank: 1,
  address: "1 rue du Test",
  daily_rate: 100,
  balance_due_date: 30,
  deposit_label: "deposit",
  deposit_percent: 30,
  guaranty: 500,
  capacity: 6,
  information: "",
  is_flat_rate_tourist_tax: false,
  tourist_tax_included_in_payment: false,
  max_daily_tourist_tax: 0,
  tourist_tax_rate: 0,
  registration_number: "",
  description: "",
  default_services: [],
  contract_template: 1,
  calendar_url: "",
  remote_calendars: [],
  ...overrides
});

const lodging = makeLodging();

const makeBooking = (overrides: Partial<Booking> = {}): Booking => ({
  id: 22,
  lodging_ids: [1],
  lodgings: [lodging],
  guest_name: "John Doe",
  guest_contact: "john@example.com",
  guest_address: "1 Guest Street",
  status: "option",
  begin_date: new Date(2026, 0, 10),
  end_date: new Date(2026, 0, 17),
  duration: 7,
  guests: 2,
  adults: 2,
  children: 0,
  babies: 0,
  guests_distribution: { 1: { adults: 2, children: 0, babies: 0 } },
  catering: "",
  daily_rate: 100,
  is_flat_rate: false,
  price: 700,
  deposit: 200,
  guaranty: 500,
  commission_fees: 0,
  arrival_details: "",
  departure_details: "",
  notes: "",
  options: [],
  total_payments: 0,
  payments: [],
  left_to_pay: 700,
  price_with_options: 700,
  price_with_options_and_taxes: 700,
  tourist_tax: 0,
  is_flat_rate_tourist_tax: false,
  tourist_tax_included_in_payment: false,
  max_daily_tourist_tax: 0,
  tourist_tax_rate: 0,
  computed_tourist_tax: 0,
  comments: [],
  cancelled: false,
  deleted: false,
  created: new Date(2026, 0, 1),
  modified: new Date(2026, 0, 1),
  ...overrides
});

const account: Account = {
  id: "acc-1",
  is_active: true,
  is_initialized: true,
  current_plan: {
    ref: "pro",
    name: "Pro",
    max_lodgings: 10,
    max_users: 10,
    price: 20,
    interval: "monthly",
    grouped_bookings: false
  },
  current_subscription: {} as any,
  created: new Date(2026, 0, 1),
  validity: new Date(2027, 0, 1),
  trial_is_over: false,
  is_free_plan: false,
  invoice_label: "",
  deposit_label: "deposit"
};

const user: User = {
  id: 1,
  is_active: true,
  first_name: "Test",
  last_name: "User",
  full_name: "Test User",
  email: "test@example.com",
  phone: "",
  address: "",
  tz: "Europe/Paris",
  legal: "",
  payment: "",
  billing: "",
  no_vat: false,
  vat_rate: 20,
  logo: null,
  signature: null,
  lodgings: [lodging],
  verified: true,
  groups: ["administrator"],
  permissions: ["core.change_booking", "core.delete_booking", "core.view_contract"]
};

// A REST-shaped booking, as the backend would return it from POST/PATCH.
const bookingRestResponse = {
  id: 22,
  lodgings: [],
  lodging_ids: [1],
  begin_date: "2026-01-10",
  end_date: "2026-01-17",
  daily_rate: "100.00",
  price: "700.00",
  deposit: "200.00",
  guaranty: "500.00",
  commission_fees: "0.00",
  total_payments: "0",
  left_to_pay: "0",
  price_with_options: "700",
  price_with_options_and_taxes: "700",
  max_daily_tourist_tax: "0",
  tourist_tax_rate: "0",
  tourist_tax: "0",
  options: [],
  comments: [],
  payments: [],
  created: "2026-01-01T00:00:00Z",
  modified: "2026-01-01T00:00:00Z"
};

function makeStore() {
  return configureStore({
    reducer: combineReducers({
      [api.reducerPath]: api.reducer,
      auth: authReducer,
      alert: alertReducer,
      appInfo: appInfoReducer
    }),
    middleware: (gdm) =>
      gdm({ serializableCheck: false, immutableCheck: false }).concat(api.middleware),
    preloadedState: {
      auth: {
        isAuthenticated: true,
        isLoading: false,
        needToReload: false,
        user,
        account
      }
    } as any
  });
}

function renderDialog(props: Partial<React.ComponentProps<typeof BookingDialog>> = {}) {
  const onClose = vi.fn();
  const store = makeStore();
  const utils = render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
            <SnackbarProvider>
              <BookingDialog
                booking={makeBooking()}
                guests={[]}
                lodgings={[lodging]}
                allOptions={[] as Service[]}
                onClose={onClose}
                {...props}
              />
            </SnackbarProvider>
          </LocalizationProvider>
        </ThemeProvider>
      </I18nextProvider>
    </Provider>
  );
  return { ...utils, onClose, store };
}

beforeAll(async () => {
  i18n.options.debug = false;
  // Render the English source strings so assertions read naturally and don't depend on the fr catalog.
  await i18n.changeLanguage("en");
});

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    const method = (config?.method ?? "get").toLowerCase();
    if (method === "get") {
      return { data: { count: 0, results: [] }, status: 200 };
    }
    return { data: bookingRestResponse, status: method === "post" ? 201 : 200 };
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("BookingDialog", () => {
  test("renders the main booking fields for an existing booking", async () => {
    renderDialog();

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    // 7 tabs are shown once the booking has an id (info, contact, details, options, payments, comments, history)
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    expect(screen.getByLabelText("Booking status")).toBeInTheDocument();
    expect(screen.getByLabelText("Lodging")).toBeInTheDocument();
    // Total price summary is rendered
    expect(screen.getByText(/^total =/)).toBeInTheDocument();
  });

  test("shows only 4 tabs and no payments/comments tab for a new (unsaved) booking", async () => {
    const newBooking = makeBooking({ id: undefined });
    renderDialog({ booking: newBooking });

    await screen.findByRole("dialog");
    expect(screen.getAllByRole("tab")).toHaveLength(4);
  });

  test("opens the history panel from the history tab", async () => {
    const uiUser = userEvent.setup();
    renderDialog();

    await screen.findByRole("dialog");
    const tabs = screen.getAllByRole("tab");
    await uiUser.click(tabs[6]);

    expect(await screen.findByTestId("history-stub")).toBeInTheDocument();
  });

  test("switches to the contact tab and shows guest fields", async () => {
    const uiUser = userEvent.setup();
    renderDialog();

    await screen.findByRole("dialog");
    const tabs = screen.getAllByRole("tab");
    await uiUser.click(tabs[1]);

    expect(await screen.findByRole("combobox", { name: /Full guest name/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Phone / email")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
  });

  test("saving an existing booking issues a PATCH and closes the dialog", async () => {
    const uiUser = userEvent.setup();
    const { onClose } = renderDialog();

    await screen.findByRole("dialog");
    await uiUser.click(screen.getByRole("button", { name: "MockSave" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const writeCall = (axios as any).mock.calls
      .map((c: any[]) => c[0])
      .find((cfg: any) => ["patch", "put", "post"].includes((cfg.method ?? "").toLowerCase()));
    expect(writeCall).toBeDefined();
    expect(writeCall.method.toLowerCase()).toBe("patch");
    expect(writeCall.url).toBe("/api/booking/22/");
  });

  test("saving a new booking issues a POST to the collection endpoint", async () => {
    const uiUser = userEvent.setup();
    const newBooking = makeBooking({ id: undefined, guest_name: "Jane Roe" });
    const { onClose } = renderDialog({ booking: newBooking });

    await screen.findByRole("dialog");
    await uiUser.click(screen.getByRole("button", { name: "MockSave" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());

    const writeCall = (axios as any).mock.calls
      .map((c: any[]) => c[0])
      .find((cfg: any) => ["patch", "put", "post"].includes((cfg.method ?? "").toLowerCase()));
    expect(writeCall).toBeDefined();
    expect(writeCall.method.toLowerCase()).toBe("post");
    expect(writeCall.url).toBe("/api/booking/");
  });

  test("does not save (and keeps the dialog open) when the required guest name is empty", async () => {
    const uiUser = userEvent.setup();
    const newBooking = makeBooking({ id: undefined, guest_name: "" });
    const { onClose } = renderDialog({ booking: newBooking });

    await screen.findByRole("dialog");
    // Mount the contact tab so the required guest-name field is registered with the form.
    await uiUser.click(screen.getAllByRole("tab")[1]);
    const guestNameInput = await screen.findByRole("combobox", { name: /Full guest name/ });
    await uiUser.click(screen.getByRole("button", { name: "MockSave" }));

    // The required field is flagged invalid and nothing is persisted / the dialog stays open.
    await waitFor(() => expect(guestNameInput).toHaveAttribute("aria-invalid", "true"));
    expect(onClose).not.toHaveBeenCalled();

    const writeCall = (axios as any).mock.calls
      .map((c: any[]) => c[0])
      .find((cfg: any) => ["patch", "put", "post"].includes((cfg.method ?? "").toLowerCase()));
    expect(writeCall).toBeUndefined();
  });
});
