import { differenceInCalendarDays } from "date-fns";
import { Booking, Service } from "../types";
import { GridValueFormatterParams } from "@mui/x-data-grid";

if (Number.EPSILON === undefined) {
  // @ts-ignore
  // noinspection JSConstantReassignment
  Number.EPSILON = Math.pow(2, -52);
}

export const DecimalPrecision = {
  round: function(n: number, p = 2) {
    const r = 0.5 * Number.EPSILON * n;
    let o = 1;
    if(p<0) while (p++ < 0) o /= 10
    else while (p-- > 0) o *= 10;
    if (n < 0)
      o *= -1;
    return Math.round((n + r) * o) / o;
  },
  ceil: function(n: number, p = 2) {
    const r = 0.5 * Number.EPSILON * n;
    let o = 1;
    while (p-- > 0) o *= 10;
    if (n < 0)
      o *= -1;
    return Math.ceil((n + r) * o) / o;
  },
  floor: function(n: number, p = 2) {
    const r = 0.5 * Number.EPSILON * n;
    let o = 1;
    while (p-- > 0) o *= 10;
    if (n < 0)
      o *= -1;
    return Math.floor((n + r) * o) / o;
  }
};

export const computeBookingPrice = (beginDate: Date, endDate: Date, dailyRate: number,
  weekendRate: number, weekRate: number, seasonalRates = [], depositPercent: number)
  : {
  price: Pick<Booking, "price" | "deposit" | "daily_rate">,
  price_details: { begin_date: Date, end_date: Date, day_count: number, rate_name: string | null, is_week_rate: boolean }[]
} => {
  // TODO compute price using seasonal rates
  // if (typeof beginDate === "string")
  //   beginDate = parseISO(beginDate);
  // if (typeof endDate === "string")
  //   endDate = parseISO(endDate);
  const duration = differenceInCalendarDays(endDate, beginDate);
  const isWeekRate = weekRate > 0 && duration >= 7;
  const rate = isWeekRate ? Number(weekRate) / 7 : Number(dailyRate);
  const price = rate * duration;
  return {
    price: {
      price: DecimalPrecision.round(price),
      deposit: DecimalPrecision.round(price * depositPercent / 100, -1),
      daily_rate: DecimalPrecision.round(rate)
    },
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

function parseBool(val: boolean | string) {
  return val === true || val === "true";
}

export const computeOptionsPrice = (options: Service[], duration: number) => {
  let totalIncluded = 0, totalExclude = 0;
  if (options) {
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option.unit_price) {
        const price = option.unit_price * (parseBool(option.is_flat_rate) ? 1 : duration);
        if (parseBool(option.not_included_in_price))
          totalExclude += price;
        else
          totalIncluded += price;
      }
    }
  }
  return [totalIncluded, totalExclude];
};

export const formatPrice = (params: GridValueFormatterParams<number>) => DecimalPrecision.round(params.value) + " €";
export const formatPercent = (params: GridValueFormatterParams<number>) => DecimalPrecision.round(params.value) + " %";
