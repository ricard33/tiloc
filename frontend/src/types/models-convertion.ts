import {
  Account,
  Booking,
  CalendarSync,
  Comment,
  Contract,
  ContractTemplate,
  Lodging,
  LodgingSeasonRate,
  LodgingSeasonRateRow,
  Payment,
  PricingAdjustment,
  Quote,
  Season,
  SeasonCalendar,
  SeasonDateRange,
  Service,
  User,
  Notification, NextEvent, Activity, BookingHistoryEntry
} from "./models";
import { parseISO } from "date-fns";
import { formatISO } from "../common/tzUtils";

export function toNumberOrUndefined(value?: number|string) {
  return value ? Number(value) : undefined;
}

export function toDecimal(value?: number | string | null, fractionDigits?: number) {
  // Form fields round-trip a cleared number as "" (not undefined): treat it like "no value"
  // instead of crashing on `"".toFixed`.
  if (value === null || typeof value === "undefined" || value === "") return null;
  const n = Number(value);
  return isNaN(n) ? null : n.toFixed(fractionDigits ?? 2);
}



// ----- PAYMENT -----

export function api2Payment(p: Record<string, any>): Payment {
  return {
    ...p as Payment,
    booking: p.booking && isNaN(p.booking) ? api2Booking(p.booking) : p.booking,
    date: parseISO(p.date),
    amount: Number(p.amount)
  };
}

export function payment2Api(p: Partial<Payment>): Record<string, any> {
  return {
    ...p,
    ...(p.date && { date: formatISO(p.date) }),
    amount: p.amount!.toFixed(2)
  };
}

// ----- COMMENT -----

export function api2Comment(p: Record<string, any>): Comment {
  return {
    ...p as Comment,
    created_on: parseISO(p.created_on),
    modified: parseISO(p.modified)
  };
}

export function comment2Api(c: Partial<Comment>): Record<string, any> {
  return {
    ...c,
    ...(c.created_on && { created_on: formatISO(c.created_on) }),
    ...(c.modified && { modified: formatISO(c.modified) })
  };
}

// ----- USER -----

export function api2User(user: Record<string, any>): User {
  return {
    ...user as User,
    vat_rate: Number(user.vat_rate),
  };
}

export function user2api(user: Partial<User>): Record<string, any> {
  const {
    logo, signature,
    lodgings,
    permissions,
    ...rest
  } = user;
  // console.log("REST", rest);
  const r = {
    ...rest,
    ...(lodgings && lodgings.length > 0 ? { lodgings } : {}),
    ...(typeof signature === "string" ? {} : { signature }),
    ...(typeof logo === "string" ? {} : { logo })
  };
  // console.log("POST", r);
  return r;
}

// ----- ACCOUNT -----

export function api2Account(account: Record<string, any>): Account {
  return {
    ...account as Account,
    created: parseISO(account.created),
    validity: parseISO(account.validity),
    current_plan: {
      ...account.current_plan,
      price: Number(account.current_plan.price)
    },
    ...(account.current_subscription ?
      {
        current_subscription: {
          ...account.current_subscription,
          created: parseISO(account.current_subscription.created),
          start_date: parseISO(account.current_subscription.start_date),
          current_period_start: parseISO(account.current_subscription.current_period_start),
          current_period_end: parseISO(account.current_subscription.current_period_end)
        }
      }
      : {})
  };
}

export function account2Api(account: Partial<Account>): Record<string, any> {
  const { created, validity, ...rest } = account;
  return {
    ...rest
    // ...(account.created && { begin_date: formatISO(account.created) }),
  };
}

// ----- LODGING -----

function api2LodgingSeasonRateRow(row: Record<string, any>): LodgingSeasonRateRow {
  return {
    id: row.id,
    season: row.season,
    nightly_rate: toNumberOrUndefined(row.nightly_rate) ?? null,
    weekend_rate: toNumberOrUndefined(row.weekend_rate) ?? null,
    min_nights: row.min_nights ?? null,
  };
}

function isBlank(value: number | string | null | undefined): boolean {
  return value === "" || value === null || typeof value === "undefined";
}

function lodgingSeasonRateRow2Api(row: LodgingSeasonRateRow): Record<string, any> {
  return {
    ...(row.id ? { id: row.id } : {}),
    season: row.season,
    nightly_rate: isBlank(row.nightly_rate) ? null : toDecimal(Number(row.nightly_rate)),
    weekend_rate: isBlank(row.weekend_rate) ? null : toDecimal(Number(row.weekend_rate)),
    min_nights: isBlank(row.min_nights) ? null : Number(row.min_nights),
  };
}

export function api2Lodging(lodging: Record<string, any>): Lodging {
  return {
    ...lodging as Lodging,
    daily_rate: Number(lodging.daily_rate),
    guaranty: Number(lodging.guaranty),
    max_daily_tourist_tax: Number(lodging.max_daily_tourist_tax),
    tourist_tax_rate: Number(lodging.tourist_tax_rate),
    remote_calendars: lodging.remote_calendars ? lodging.remote_calendars.map(api2CalendarSync) : [],
    season_calendar: lodging.season_calendar ?? null,
    min_nights: Number(lodging.min_nights ?? 1),
    weekly_discount_percent: toNumberOrUndefined(lodging.weekly_discount_percent) ?? null,
    monthly_discount_percent: toNumberOrUndefined(lodging.monthly_discount_percent) ?? null,
    season_rates: (lodging.season_rates ?? []).map(api2LodgingSeasonRateRow),
  };
}

export function lodging2api(lodging: Partial<Lodging>): Record<string, any> {
  return {
    ...lodging,
    weekly_discount_percent: toDecimal(lodging.weekly_discount_percent ?? undefined),
    monthly_discount_percent: toDecimal(lodging.monthly_discount_percent ?? undefined),
    ...(lodging.season_rates ? { season_rates: lodging.season_rates.map(lodgingSeasonRateRow2Api) } : {}),
  };
}

// ----- SEASON CALENDAR -----

export function api2SeasonDateRange(range: Record<string, any>): SeasonDateRange {
  return {
    ...range as SeasonDateRange,
    begin_date: parseISO(range.begin_date),
    end_date: parseISO(range.end_date),
  };
}

export function api2Season(season: Record<string, any>): Season {
  return {
    ...season as Season,
    date_ranges: (season.date_ranges ?? []).map(api2SeasonDateRange),
  };
}

export function api2SeasonCalendar(calendar: Record<string, any>): SeasonCalendar {
  return {
    ...calendar as SeasonCalendar,
    seasons: (calendar.seasons ?? []).map(api2Season),
  };
}

export function seasonCalendar2Api(calendar: Partial<SeasonCalendar>): Record<string, any> {
  return {
    ...calendar,
    seasons: (calendar.seasons ?? []).map((season) => ({
      ...(season.id ? { id: season.id } : {}),
      name: season.name,
      color: season.color || "#3788d8",
      rank: season.rank ?? 0,
      date_ranges: (season.date_ranges ?? []).map((range) => ({
        ...(range.id ? { id: range.id } : {}),
        begin_date: formatISO(range.begin_date),
        end_date: formatISO(range.end_date),
      })),
    })),
  };
}

// ----- LODGING SEASON RATE -----

export function api2LodgingSeasonRate(rate: Record<string, any>): LodgingSeasonRate {
  return {
    ...rate as LodgingSeasonRate,
    nightly_rate: Number(rate.nightly_rate),
    weekend_rate: toNumberOrUndefined(rate.weekend_rate) ?? null,
    min_nights: rate.min_nights ?? null,
  };
}

export function lodgingSeasonRate2Api(rate: Partial<LodgingSeasonRate>): Record<string, any> {
  return {
    ...rate,
    nightly_rate: toDecimal(rate.nightly_rate ?? undefined),
    weekend_rate: toDecimal(rate.weekend_rate ?? undefined),
  };
}

// ----- PRICING ADJUSTMENT -----

export function api2PricingAdjustment(adjustment: Record<string, any>): PricingAdjustment {
  return {
    ...adjustment as PricingAdjustment,
    value: Number(adjustment.value),
    stay_begin: adjustment.stay_begin ? parseISO(adjustment.stay_begin) : null,
    stay_end: adjustment.stay_end ? parseISO(adjustment.stay_end) : null,
    booking_begin: adjustment.booking_begin ? parseISO(adjustment.booking_begin) : null,
    booking_end: adjustment.booking_end ? parseISO(adjustment.booking_end) : null,
  };
}

export function pricingAdjustment2Api(adjustment: Partial<PricingAdjustment>): Record<string, any> {
  return {
    ...adjustment,
    value: toDecimal(adjustment.value ?? undefined),
    ...(adjustment.stay_begin ? { stay_begin: formatISO(adjustment.stay_begin) } : {}),
    ...(adjustment.stay_end ? { stay_end: formatISO(adjustment.stay_end) } : {}),
    ...(adjustment.booking_begin ? { booking_begin: formatISO(adjustment.booking_begin) } : {}),
    ...(adjustment.booking_end ? { booking_end: formatISO(adjustment.booking_end) } : {}),
  };
}

// ----- QUOTE -----

export function api2Quote(quote: Record<string, any>): Quote {
  return {
    ...quote as Quote,
    begin_date: parseISO(quote.begin_date),
    end_date: parseISO(quote.end_date),
    booking_date: parseISO(quote.booking_date),
    total_price: Number(quote.total_price),
    total_deposit: Number(quote.total_deposit),
    effective_daily_rate: Number(quote.effective_daily_rate),
    lodgings: (quote.lodgings ?? []).map((lodging: Record<string, any>) => ({
      ...lodging,
      nightly_subtotal: Number(lodging.nightly_subtotal),
      price: Number(lodging.price),
      deposit: Number(lodging.deposit),
      nights: (lodging.nights ?? []).map((night: Record<string, any>) => ({
        ...night,
        date: parseISO(night.date),
        base_rate: Number(night.base_rate),
        applied_rate: Number(night.applied_rate),
      })),
      adjustments: (lodging.adjustments ?? []).map((adjustment: Record<string, any>) => ({
        ...adjustment,
        amount: Number(adjustment.amount),
        ...(adjustment.basis !== undefined ? { basis: Number(adjustment.basis) } : {}),
        ...(adjustment.percent !== undefined ? { percent: Number(adjustment.percent) } : {}),
        ...(adjustment.value !== undefined ? { value: Number(adjustment.value) } : {}),
      })),
    })),
  };
}

// ----- BOOKING -----

export function api2Booking(booking: Record<string, any>): Booking {
  return {
    ...booking as Booking,
    lodgings: booking.lodgings.map(api2Lodging),
    begin_date: parseISO(booking.begin_date),
    end_date: parseISO(booking.end_date),
    daily_rate: Number(booking.daily_rate),
    price: Number(booking.price),
    deposit: Number(booking.deposit),
    guaranty: Number(booking.guaranty),
    commission_fees: Number(booking.commission_fees),
    total_payments: Number(booking.total_payments),
    payments: booking.payments ? booking.payments.map(api2Payment) : [],
    left_to_pay: Number(booking.left_to_pay),
    price_with_options: Number(booking.price_with_options),
    price_with_options_and_taxes: Number(booking.price_with_options_and_taxes),
    max_daily_tourist_tax: Number(booking.max_daily_tourist_tax),
    tourist_tax_rate: Number(booking.tourist_tax_rate),
    tourist_tax: Number(booking.tourist_tax),
    custom_tourist_tax: toNumberOrUndefined(booking.custom_tourist_tax),
    options: booking.options ? booking.options.map(api2Service) : [],
    comments: booking.comments ? booking.comments.map(api2Comment) : [],
    price_details: booking.price_details ? api2Quote(booking.price_details) : null,
    created: parseISO(booking.created),
    modified: parseISO(booking.modified)
  };
}

export function booking2api(booking: Partial<Booking>): Record<string, any> {
  // `daily_rate` and `price_details` are engine-computed and read-only on the API.
  const { price_details, daily_rate, ...rest } = booking;
  const newVar = {
    ...rest,
    ...(booking.begin_date && { begin_date: formatISO(booking.begin_date) }),
    ...(booking.end_date && { end_date: formatISO(booking.end_date) }),
    price: booking.price!.toFixed(2),
    deposit: booking.deposit!.toFixed(2),
    guaranty: booking.guaranty!.toFixed(2),
    commission_fees: booking.commission_fees!.toFixed(2),
    max_daily_tourist_tax: toDecimal(booking.max_daily_tourist_tax),
    tourist_tax_rate: toDecimal(booking.tourist_tax_rate),
    custom_tourist_tax: toDecimal(booking.custom_tourist_tax)
  };
  return newVar;

}

// ----- SERVICE -----

export function api2Service(service: Record<string, any>): Service {
  return {
    ...service as Service,
    unit_price: Number(service.unit_price),
    vat: Number(service.vat)
  };
}

// ----- CONTRACT TEMPLATE -----

export function api2ContractTemplate(contractTemplate: Record<string, any>): ContractTemplate {
  return {
    ...contractTemplate as ContractTemplate,
    created: parseISO(contractTemplate.created),
    modified: parseISO(contractTemplate.modified)
  };
}

// ----- CONTRACT -----

export function api2Contract(contract: Record<string, any>): Contract {
  return {
    ...contract as Contract,
    created: parseISO(contract.created),
    modified: parseISO(contract.modified)
  };
}

// ----- CALENDAR SYNC -----

export function api2CalendarSync(calendarSync: Record<string, any>): CalendarSync {
  return {
    ...calendarSync as CalendarSync,
    last_import: parseISO(calendarSync.last_import),
    last_export: parseISO(calendarSync.last_export)
  };
}

// ----- NOTIFICATION -----

export function api2Notification(notification: Record<string, any>): Notification {
  return {
    ...notification as Notification,
    date: parseISO(notification.date)
  };
}

// ----- NEXT EVENTS -----

export function api2NextEvent(event: Record<string, any>): NextEvent {
  return {
    ...api2Booking(event as NextEvent),
    event_type: event.event_type,
    date: parseISO(event.date)
  };
}

// ----- ACTIVITY -----

export function api2Activity(activity: Record<string, any>): Activity {
  return {
    ...activity as Activity,
    date: parseISO(activity.date),
    booking: api2Booking(activity.booking),
  };
}

// ----- BOOKING HISTORY -----

export function api2BookingHistoryEntry(entry: Record<string, any>): BookingHistoryEntry {
  return {
    ...entry as BookingHistoryEntry,
    date: parseISO(entry.date),
  };
}

