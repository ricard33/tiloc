import { differenceInCalendarDays, parseISO } from "date-fns";

export const computeBookingPrice = (beginDate, endDate, dailyRate, weekendRate, weekRate, seasonalRates=[],
  depositPercent) => {
  // TODO compute price using seasonal rates
  const duration = differenceInCalendarDays(parseISO(endDate), parseISO(beginDate));
  const isWeekRate = weekRate && duration >= 7;
  const rate = isWeekRate ? weekRate / 7 : dailyRate;
  const price = rate * duration;
  return {
    price: price,
    deposit: Math.round(price * depositPercent / 100),
    daily_rate: rate,
    price_details: [
      {
        begin_date: beginDate,
        end_date: endDate,
        day_count: duration,
        rate_name: null,
        is_week_rate: isWeekRate
      }
    ]
  }
}

export const computeDeposit = (price, percent, rounding) => {

}
