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
  },
};

export const computeBookingPrice = (beginDate, endDate, dailyRate, weekendRate, weekRate, seasonalRates = [],
  depositPercent) => {
  // TODO compute price using seasonal rates
  const duration = differenceInCalendarDays(parseISO(endDate), parseISO(beginDate));
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
