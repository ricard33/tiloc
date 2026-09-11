export type FillingRateRow = {
  date: string;
  days: number;
  capacity: number;
  rate: number;
  turnover?: number;
  lodgings?: number[];
  [lodgingId: number]: unknown;
};

export type ChannelRow = {
  channel: string | null;
  count: number;
  turnover?: number;
};

export type BucketRow = {
  label: string;
  count: number;
};

export type BookingFunnelData = {
  funnel: { status: string; count: number }[];
  total_bookings: number;
  cancelled_bookings: number;
  cancellation_rate: number | null;
  contracts_sent: number;
  contracts_signed: number;
  signature_rate: number | null;
  average_length_of_stay: number | null;
  length_of_stay_distribution: BucketRow[];
  average_lead_time: number | null;
  lead_time_distribution: BucketRow[];
};

export const emptyBookingFunnelData: BookingFunnelData = {
  funnel: [],
  total_bookings: 0,
  cancelled_bookings: 0,
  cancellation_rate: null,
  contracts_sent: 0,
  contracts_signed: 0,
  signature_rate: null,
  average_length_of_stay: null,
  length_of_stay_distribution: [],
  average_lead_time: null,
  lead_time_distribution: [],
};

export type SeasonBreakdownRow = {
  days: number;
  bookings: number;
  turnover?: number;
};

export type SeasonBreakdownData = Record<string, SeasonBreakdownRow>;

export type PaymentMethodRow = {
  method: string;
  count: number;
  total: number;
};

export type PaymentsOverviewData = {
  payment_methods: PaymentMethodRow[];
  total_collected: number;
  total_outstanding: number;
  total_tourist_tax: number;
  total_guests: number;
  bookings_count: number;
};

export const emptyPaymentsOverviewData: PaymentsOverviewData = {
  payment_methods: [],
  total_collected: 0,
  total_outstanding: 0,
  total_tourist_tax: 0,
  total_guests: 0,
  bookings_count: 0,
};
