import { differenceInCalendarDays, parseISO } from "date-fns";

if (Number.EPSILON === undefined) {
  Number.EPSILON = Math.pow(2, -52);
}

export const DecimalPrecision = {
  round: function(n, p = 2) {
    let r = 0.5 * Number.EPSILON * n;
    let o = 1;
    while (p-- > 0) o *= 10;
    if (n < 0)
      o *= -1;
    return Math.round((n + r) * o) / o;
  },
  ceil: function(n, p = 2) {
    let r = 0.5 * Number.EPSILON * n;
    let o = 1;
    while (p-- > 0) o *= 10;
    if (n < 0)
      o *= -1;
    return Math.ceil((n + r) * o) / o;
  },
  floor: function(n, p = 2) {
    let r = 0.5 * Number.EPSILON * n;
    let o = 1;
    while (p-- > 0) o *= 10;
    if (n < 0)
      o *= -1;
    return Math.floor((n + r) * o) / o;
  }
};

export const computeBookingPrice = (beginDate, endDate, dailyRate, weekendRate, weekRate, seasonalRates = [],
  depositPercent) => {
  // TODO compute price using seasonal rates
  if (typeof beginDate === "string")
    beginDate = parseISO(beginDate);
  if (typeof endDate === "string")
    endDate = parseISO(endDate);
  const duration = differenceInCalendarDays(endDate, beginDate);
  const isWeekRate = weekRate && duration >= 7;
  const rate = isWeekRate ? Number(weekRate) / 7 : Number(dailyRate);
  const price = rate * duration;
  return {
    price: DecimalPrecision.round(price),
    deposit: DecimalPrecision.round(price * depositPercent / 100, 0),
    daily_rate: DecimalPrecision.round(rate),
    price_details: [
      {
        begin_date: beginDate,
        end_date: endDate,
        day_count: duration,
        rate_name: null,
        is_week_rate: isWeekRate
      }
    ]
  };
};

export const computeOptionsPrice = (options, duration) => {
  let total = 0;
  if (options) {
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option.unit_price_ht) {
        total += (option.vat ? option.unit_price_ht * (100 + option.vat) / 100 : option.unit_price_ht)
          * Number(option.quantity) * (option.is_flat_rate ? 1 : duration);
      }
    }
    return total;
  }
};
