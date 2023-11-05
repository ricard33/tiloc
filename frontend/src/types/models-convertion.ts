import { Booking, CalendarSync, Comment, Contract, ContractTemplate, Lodging, Payment, Service, User } from "./models";
import { parseISO } from "date-fns";
import { formatISO } from "../common/tzUtils";


// ----- PAYMENT -----

export function api2Payment(p: Record<string, any>): Payment {
  return {
    ...p as Payment,
    booking: isNaN(p.booking) ? api2Booking(p.booking) : p.booking,
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
    modified: parseISO(p.modified),
  };
}

export function comment2Api(c: Partial<Comment>): Record<string, any> {
  return {
    ...c,
    ...(c.created_on && { created_on: formatISO(c.created_on) }),
    ...(c.modified && { modified: formatISO(c.modified) }),
  };
}

// ----- USER -----

export function api2User(user: Record<string, any>): User {
  return {
    ...user as User,
    vat_rate: Number(user.vat_rate)
  };
}

export function user2api(user: Partial<User>): Record<string, any> {
  const {
    logo, signature,
    lodgings,
    account, permissions,
    ...rest
  } = user;
  console.log("REST", rest);
  const r = {
    ...rest,
    ...(lodgings && lodgings.length > 0 ? { lodgings } : {}),
    ...(typeof signature === "string" ? { } : { signature }),
    ...(typeof logo === "string" ? { } : { logo }),
  };
  console.log("POST", r);
  return r;
}
// ----- LODGING -----

export function api2Lodging(lodging: Record<string, any>): Lodging {
  return {
    ...lodging as Lodging,
    daily_rate: Number(lodging.daily_rate),
    guaranty: Number(lodging.guaranty),
    max_daily_tourist_tax: Number(lodging.max_daily_tourist_tax),
    tourist_tax_rate: Number(lodging.tourist_tax_rate)
  };
}

// ----- BOOKING -----

export function api2Booking(booking: Record<string, any>): Booking {
  return {
    ...booking as Booking,
    lodging: api2Lodging(booking.lodging),
    begin_date: parseISO(booking.begin_date),
    end_date: parseISO(booking.end_date),
    daily_rate: Number(booking.daily_rate),
    price: Number(booking.price),
    deposit: Number(booking.deposit),
    guaranty: Number(booking.guaranty),
    commission_fees: Number(booking.commission_fees),
    total_payments: Number(booking.total_payments),
    left_to_pay: Number(booking.left_to_pay),
    price_with_options: Number(booking.price_with_options),
    tourist_tax: Number(booking.tourist_tax),
    options: booking.options ? booking.options.map(api2Service) : [],
    comments: booking.comments ? booking.comments.map(api2Comment) : [],
    created: parseISO(booking.created),
    modified: parseISO(booking.modified),
  };
}

export function booking2api(booking: Partial<Booking>): Record<string, any> {
  return {
    ...booking,
    ...(booking.begin_date && { begin_date: formatISO(booking.begin_date) }),
    ...(booking.end_date && { end_date: formatISO(booking.end_date) }),
    daily_rate: booking.daily_rate!.toFixed(2),
    price: booking.price!.toFixed(2),
    deposit: booking.deposit!.toFixed(2),
    guaranty: booking.guaranty!.toFixed(2),
    commission_fees: booking.commission_fees!.toFixed(2)
  };

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
    modified: parseISO(contractTemplate.modified),
  };
}

// ----- CONTRACT -----

export function api2Contract(contract: Record<string, any>): Contract {
  return {
    ...contract as Contract,
    created: parseISO(contract.created),
    modified: parseISO(contract.modified),
  };
}

// ----- CALENDAR SYNC -----

export function api2CalendarSync(calendarSync: Record<string, any>): CalendarSync {
  return {
    ...calendarSync as CalendarSync,
    last_import: parseISO(calendarSync.last_import),
    last_export: parseISO(calendarSync.last_export),
  };
}
