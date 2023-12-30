import {
  Account,
  Booking,
  CalendarSync,
  Comment,
  Contract,
  ContractTemplate,
  Lodging,
  Payment,
  Service,
  User,
  Notification, NextEvent, Activity
} from "./models";
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
    custom_tourist_tax: booking.custom_tourist_tax ? Number(booking.custom_tourist_tax) : undefined,
    options: booking.options ? booking.options.map(api2Service) : [],
    comments: booking.comments ? booking.comments.map(api2Comment) : [],
    created: parseISO(booking.created),
    modified: parseISO(booking.modified)
  };
}

export function booking2api(booking: Partial<Booking>): Record<string, any> {
  const newVar = {
    ...booking,
    ...(booking.begin_date && { begin_date: formatISO(booking.begin_date) }),
    ...(booking.end_date && { end_date: formatISO(booking.end_date) }),
    daily_rate: booking.daily_rate!.toFixed(2),
    price: booking.price!.toFixed(2),
    deposit: booking.deposit!.toFixed(2),
    guaranty: booking.guaranty!.toFixed(2),
    commission_fees: booking.commission_fees!.toFixed(2),
    custom_tourist_tax: typeof booking.custom_tourist_tax === "undefined" ?
      null : booking.custom_tourist_tax.toFixed(2)
  };
  console.log("booking2api:  ", newVar);
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

