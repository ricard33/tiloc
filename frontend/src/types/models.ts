export interface SignUpData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  plan: string;
  tz: string;
}

export interface LoginInfo {
  expiry: string;
  token: string;
  user: User & { account: Account };
}

export interface Subscription {
  id: string;
  customer: Account;
  plan: {};
  created: Date;
  start_date: Date;
  current_period_start: Date;
  current_period_end: Date;
  status: string;
  cancel_at_period_end: boolean;
  latest_invoice: string;
  default_payment_method: {
    type: string;
    description: string;
    exp_month: number;
    exp_year: number;
  };
  customer_dashboard_url: string;
}

export interface Account {
  id: string;
  is_active: boolean;
  is_initialized: boolean;
  current_plan: {
    ref: string;
    name: string;
    max_lodgings: number;
    max_users: number;
    price: number;
    interval: "monthly" | "yearly";
    grouped_bookings: boolean;
  };
  current_subscription: Subscription;
  created: Date;
  validity: Date;
  trial_is_over: boolean;
  is_free_plan: boolean;
  invoice_label: string;
  deposit_label: string;
}

export interface User {
  id: number;
  // account: Account;
  is_active: boolean;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  tz: string;
  legal: string;
  payment: string;
  billing: string;
  no_vat: boolean;
  vat_rate: number;
  logo: string | null;
  signature: string | null;
  lodgings: Lodging[];
  verified: boolean;
  groups: string[];
  permissions: string[];
}

export interface Lodging {
  id: number;
  active: boolean;
  shown: boolean;
  name: string;
  owner_id: number;
  owner: Pick<User, "id" | "full_name" | "email">;
  rank: number;
  address: string;
  daily_rate: number;
  balance_due_date: number;
  deposit_label: "deposit" | "down_payment";
  deposit_percent: number;
  guaranty: number;
  capacity: number;
  information: string;
  is_flat_rate_tourist_tax: boolean;
  tourist_tax_included_in_payment: boolean;
  max_daily_tourist_tax: number;
  tourist_tax_rate: number;
  registration_number: string;
  description: string;
  default_services: string[];  // list of refs
  contract_template: number;
  calendar_url: string;
  remote_calendars: Omit<CalendarSync, "lodging"|"lodging_id">[];
  season_calendar?: number | null;
  min_nights?: number;
  weekly_discount_percent?: number | null;
  monthly_discount_percent?: number | null;
  season_rates?: LodgingSeasonRateRow[];
}

export interface SeasonDateRange {
  id?: number;
  begin_date: Date;
  end_date: Date;
}

export interface Season {
  id?: number;
  name: string;
  color: string;
  rank: number;
  date_ranges: SeasonDateRange[];
}

export interface SeasonCalendar {
  id?: number;
  name: string;
  notes: string;
  seasons: Season[];
  lodging_count?: number;
}

export interface LodgingSeasonRate {
  id?: number;
  lodging: number;
  season: number;
  nightly_rate: number;
  weekend_rate?: number | null;
  min_nights?: number | null;
}

// A LodgingSeasonRate row as edited inline in the Lodging form's "Advanced pricing" section
// (nested under Lodging.season_rates, saved together with the lodging — no `lodging` field,
// and the number fields may be "" while a row is blank/being edited).
export interface LodgingSeasonRateRow {
  id?: number;
  season: number;
  nightly_rate?: number | string | null;
  weekend_rate?: number | string | null;
  min_nights?: number | string | null;
}

export type PricingAdjustmentType = "percent" | "fixed";

export interface PricingAdjustment {
  id?: number;
  name: string;
  lodging?: number | null;
  adjustment_type: PricingAdjustmentType;
  value: number;
  min_nights?: number | null;
  max_nights?: number | null;
  min_days_before_arrival?: number | null;
  max_days_before_arrival?: number | null;
  stay_begin?: Date | null;
  stay_end?: Date | null;
  booking_begin?: Date | null;
  booking_end?: Date | null;
  applicable_weekdays?: number[] | null;
  priority: number;
  stackable: boolean;
  active: boolean;
}

export interface QuoteNight {
  date: Date;
  weekday: number;
  season: string | null;
  rate_source: "season_rate" | "lodging_default";
  base_rate: number;
  applied_rate: number;
  is_weekend: boolean;
}

export interface QuoteAdjustment {
  type: "los_discount" | "rule" | "flat_rate";
  label: string;
  amount: number;
  basis?: number;
  percent?: number;
  rule_id?: number;
  kind?: string;
  value?: number;
  stackable?: boolean;
}

export interface QuoteWarning {
  code: "min_nights" | "season_overlap";
  lodging_id: number;
  required?: number;
  actual?: number;
  date?: string;
}

export interface QuoteLodging {
  lodging_id: number;
  lodging_name: string;
  season_calendar_id: number | null;
  nightly_subtotal: number;
  price: number;
  deposit: number;
  nights: QuoteNight[];
  adjustments: QuoteAdjustment[];
  warnings: QuoteWarning[];
}

export interface Quote {
  begin_date: Date;
  end_date: Date;
  nights: number;
  booking_date: Date;
  currency: string;
  total_price: number;
  total_deposit: number;
  effective_daily_rate: number;
  is_flat_rate: boolean;
  warnings: QuoteWarning[];
  lodgings: QuoteLodging[];
}

export interface QuoteRequest {
  lodging_ids: number[];
  begin_date: string;
  end_date: string;
  booking_date?: string;
  is_flat_rate?: boolean;
  flat_price?: string;
}

export interface RateCalendarEntry {
  date: string;   // ISO date
  rate: string;   // formatted "123.00"
  season: string | null;
  season_color: string | null;
  is_weekend: boolean;
}

export interface Service {
  id: number;
  reference: string;
  designation: string;
  unit_price: number;
  vat: number;
  is_flat_rate: boolean;
  not_included_in_price: boolean;
}

export interface BookingChannel {
  id: number;
  name: string;
  read_only: boolean;
}

export interface Comment {
  id: number;
  content: string;
  booking_id: number;
  created_by: Pick<User, "id" | "full_name" | "email">;
  created_on: Date;
  modified: Date;

}

export interface Booking {
  id?: number;
  lodging_ids: number[];
  lodgings: Lodging[];
  guest_name: string;
  guest_contact?: string;
  guest_address?: string;
  status: string;
  source_id?: number;
  source?: BookingChannel;
  begin_date: Date;
  end_date: Date;
  duration: number;
  guests: number;
  adults: number;
  children: number;
  babies: number;
  guests_distribution: Record<number, {
    adults: number;
    children: number;
    babies: number;
  }>;
  catering: string;
  daily_rate?: number;
  is_flat_rate: boolean;
  price?: number;
  price_details?: Quote | null;
  deposit?: number;
  guaranty?: number;
  commission_fees?: number;
  arrival_details?: string;
  departure_details?: string;
  notes?: string;
  options: Service[];
  total_payments: number;
  payments: Payment[];
  left_to_pay: number;
  price_with_options: number;
  price_with_options_and_taxes: number;
  tourist_tax: number;
  is_flat_rate_tourist_tax: boolean;
  tourist_tax_included_in_payment: boolean;
  max_daily_tourist_tax?: number;
  tourist_tax_rate?: number;
  computed_tourist_tax: number;
  custom_tourist_tax?: number;
  comments: Comment[];
  cancelled: boolean;
  deleted: boolean;
  created: Date;
  modified: Date;
}

export interface ContractTemplate {
  id: number;
  name: string;
  content: string;
  created: Date;
  modified: Date;
}

export interface Contract {
  id: number;
  booking: number;
  content: string;
  pdf: string;
  pdf_created: string;
  signed: string;
  created: Date;
  modified: Date;
}

export interface Payment {
  id?: number;
  booking_id: number;
  booking: Booking;
  description: string;
  amount: number;
  method: string;
  date: Date;
  checked: boolean;
}

export const paymentMethods = (t: (key: string) => string) => {
  return [
    ["cash", t("Cash")],
    ["bank_card", t("Bank card")],
    ["check", t("Check")],
    ["transfer", t("Transfer")],
    ["paypal", t("PayPal")],
    ["vouchers", t("Holiday vouchers")],
    ["other", t("Other")]
  ];
};

export interface Guest {
  name: string;
  contact: string;
  address: string;
}

export interface NextEvent extends Booking {
  date: Date;
  event_type: "CHECKOUT" | "CHECKIN";
}

export interface CalendarSync {   // name is BookingChannelSync on API
  id: number;
  channel_id: number;
  channel: BookingChannel;
  lodging_id: number;
  lodging: Lodging;
  source_url: string;
  url_for_remote: string;
  active: boolean;
  last_import: Date;
  last_export: Date;
  last_import_error: string;
}

export interface Notification {
  id: number;
  notification: string;
  date: Date;
  description: string;
  path: string;
  read: boolean;
}

export interface NotificationPreference {
  name: string;
  display_name: string;
  backends: Record<string, boolean>; // e.g. { noop: true, email: false }
}

export interface Activity {
  id: number;
  type: string;
  date: Date;
  author: User;
  booking: Booking;
}

export interface BookingHistoryChange {
  field: string;
  old: unknown;
  new: unknown;
}

export interface BookingHistoryEntry {
  history_id: number;
  date: Date;
  type: "+" | "~" | "-";
  type_label: string;
  user: Pick<User, "id" | "full_name" | "email"> | null;
  changes: BookingHistoryChange[];
}
