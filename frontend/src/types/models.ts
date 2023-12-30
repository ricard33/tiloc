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
  user: User&{account: Account};
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
    interval: "monthly" | "yearly"
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
  chatwoot_identifier_hash: string;
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
  deposit_label: "deposit"|"down_payment";
  deposit_percent: number;
  guaranty: number;
  capacity: number;
  information: string;
  is_flat_rate_tourist_tax: boolean;
  tourist_tax_included_in_payment: boolean;
  max_daily_tourist_tax: number;
  tourist_tax_rate: number;
  description: string;
  default_services: string[];  // list of refs
  contract_template: number;
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
  lodging_id: number;
  lodging: Lodging;
  guest_name?: string;
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
  catering: string;
  daily_rate?: number;
  is_flat_rate: boolean;
  price?: number;
  deposit?: number;
  guaranty?: number;
  commission_fees?: number;
  arrival_details?: string;
  notes?: string;
  options: Service[];
  total_payments: number;
  left_to_pay: number;
  price_with_options: number;
  tourist_tax: number;
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

export interface Activity {
  id: number;
  type: string;
  date: Date;
  author: User;
  booking: Booking;
}
