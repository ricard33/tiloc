import { Booking, Lodging, Owner, Payment, Service } from "./models";


export function api2Payment(p: Record<string, any>): Payment {
  return {
    ...p as Payment,
    amount: Number(p.amount)
  };
}

export function payment2Api(p: Payment): Record<string, any> {
  return {
    ...p,
    amount: p.amount.toFixed(2)
  };
}

// ----- OWNER -----

export function api2Owner(owner: Record<string, any>): Owner {
  return {
    ...owner as Owner,
    vat_rate: Number(owner.vat_rate),
  };
}

// ----- LODGING -----

export function api2Lodging(lodging: Record<string, any>): Lodging {
  return {
    ...lodging as Lodging,
    daily_rate: Number(lodging.daily_rate),
    guaranty: Number(lodging.guaranty),
    tourist_tax: Number(lodging.tourist_tax),
  };
}

// ----- BOOKING -----

export function api2Booking(booking: Record<string, any>): Booking {
  return {
    ...booking as Booking,
    lodging: api2Lodging(booking.lodging),
    daily_rate: Number(booking.daily_rate),
    price: Number(booking.price),
    deposit: Number(booking.deposit),
    guaranty: Number(booking.guaranty),
    commission_fees: Number(booking.commission_fees),
    total_payments: Number(booking.total_payments),
    left_to_pay: Number(booking.left_to_pay),
    price_with_options: Number(booking.price_with_options),
    options: booking.options.map(api2Service),
  };
}

// ----- SERVICE -----

export function api2Service(service: Record<string, any>): Service {
  return {
    ...service as Service,
    unit_price: Number(service.unit_price),
    vat: Number(service.vat),
  };
}
