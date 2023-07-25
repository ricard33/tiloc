export interface LoginInfo {
  expiry: string;
  token: string;
  user: User;
}

export interface User {
  id: number;
  is_active: boolean;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  permissions: string[];
}

export interface Property {
  id: number;
  active: boolean;
  name: string;
  email: string;
  phone: string;
  contact: string;
  address: string;
  legal: string;
  payment: string;
  billing: string;
  no_vat: boolean;
  vat_rate: number;
  note: string;
  invoice_label: string;
  deposit_label: string;
  logo: string|null;
  signature: string|null;
  display_week: boolean;
}

export interface Lodging {
  id: number;
  active: boolean;
  shown: boolean;
  name: string;
  property_id: number;
  property: Extract<Property, "id" | "name">;
  rank: number;
  address: string;
  daily_rate: number;
  guaranty: number;
  capacity: number;
  information: string;
  tourist_tax: number;
  description: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Service {
  id: number;
  reference: string;
  category: number;
  designation: string;
  unit_price: number;
  vat: number;
  is_flat_rate: boolean;
  // included_in_booking: boolean;
  not_included_in_price: boolean;
  auto_add_booking: boolean;
  auto_add_invoice: boolean;
}

export interface BookingStatus {
  id: number;
  name: string;
  color: string;
  rank: number;
}

export interface BookingChannel {
  id: number;
  name: string;
  default_booking_status_id?: number | null;
  default_booking_status?: BookingStatus;
}

export interface Booking {
  id?: number;
  lodging_id: number;
  lodging: Lodging;
  guest_name?: string;
  guest_contact?: string;
  guest_address?: string;
  status_id: number;
  status: BookingStatus;
  source_id?: number;
  source?: BookingChannel;
  begin_date: Date;
  end_date: Date;
  duration: number;
  adults: number;
  children: number;
  babies: number;
  catering: string;
  daily_rate?: number
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

export interface NextEvent {
  id: number;
  date: string;
  lodging_name: string;
  event_type: "CHECKOUT"|"CHECKIN";
  guest_name: string;
  booking_channel: string;
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
