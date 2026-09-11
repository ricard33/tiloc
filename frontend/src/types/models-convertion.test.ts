import {
  api2Quote,
  api2SeasonCalendar,
  booking2api,
  pricingAdjustment2Api,
  seasonCalendar2Api,
  toDecimal,
  toNumberOrUndefined
} from "./models-convertion";
import { Booking } from "./models";

describe("Models conversions", function() {
  it("toNumber", () => {
    expect(toNumberOrUndefined("23")).toEqual(23);
    expect(toNumberOrUndefined("23.35")).toEqual(23.35);
    expect(toNumberOrUndefined(undefined)).toBeUndefined();
  });

  it("toDecimal", () => {
    expect(toDecimal(23)).toEqual("23.00");
    expect(toDecimal(23.35)).toEqual("23.35");
    expect(toDecimal(23.3555)).toEqual("23.36");
    expect(toDecimal(23.3554, 3)).toEqual("23.355");
    expect(toDecimal(23.3556, 3)).toEqual("23.356");
    expect(toDecimal(undefined)).toBeNull();
  });

  it("api2SeasonCalendar parses nested seasons and dated ranges", () => {
    const calendar = api2SeasonCalendar({
      id: 1,
      name: "Standard",
      seasons: [
        { id: 2, name: "High", color: "#f00", rank: 0, date_ranges: [{ id: 3, begin_date: "2027-07-01", end_date: "2027-08-31" }] }
      ]
    });
    expect(calendar.seasons[0].date_ranges[0].begin_date).toBeInstanceOf(Date);
    expect(calendar.seasons[0].date_ranges[0].begin_date.getFullYear()).toEqual(2027);
  });

  it("seasonCalendar2Api serialises ranges to ISO and drops missing ids", () => {
    const payload = seasonCalendar2Api({
      name: "Standard",
      notes: "",
      seasons: [{ name: "High", color: "#f00", rank: 1, date_ranges: [{ begin_date: new Date(2027, 6, 1), end_date: new Date(2027, 7, 31) }] }]
    });
    expect(payload.seasons[0]).not.toHaveProperty("id");
    expect(typeof payload.seasons[0].date_ranges[0].begin_date).toEqual("string");
  });

  it("api2Quote parses money strings to numbers and night dates", () => {
    const quote = api2Quote({
      begin_date: "2027-04-05", end_date: "2027-04-08", nights: 3, booking_date: "2027-01-01",
      currency: "EUR", total_price: "300.00", total_deposit: "90.00", effective_daily_rate: "100.00",
      is_flat_rate: false, warnings: [],
      lodgings: [{
        lodging_id: 1, lodging_name: "A", season_calendar_id: null,
        nightly_subtotal: "300.00", price: "300.00", deposit: "90.00",
        nights: [{ date: "2027-04-05", weekday: 0, season: null, rate_source: "lodging_default", base_rate: "100.00", applied_rate: "100.00", is_weekend: false }],
        adjustments: [{ type: "los_discount", label: "Weekly discount", amount: "-30.00", basis: "300.00", percent: "-10.00" }],
        warnings: []
      }]
    });
    expect(quote.total_price).toEqual(300);
    expect(quote.lodgings[0].adjustments[0].amount).toEqual(-30);
    expect(quote.lodgings[0].nights[0].date).toBeInstanceOf(Date);
  });

  it("pricingAdjustment2Api formats the value and only present dates", () => {
    const payload = pricingAdjustment2Api({ name: "x", adjustment_type: "percent", value: -15, priority: 0, stackable: true, active: true });
    expect(payload.value).toEqual("-15.00");
    expect(payload).not.toHaveProperty("stay_begin");
  });

  it("booking2api drops the engine-computed daily_rate and price_details", () => {
    const payload = booking2api({
      begin_date: new Date(2027, 3, 5),
      end_date: new Date(2027, 3, 8),
      daily_rate: 123.45,
      price: 370,
      deposit: 110,
      guaranty: 300,
      commission_fees: 0,
      price_details: {} as Booking["price_details"]
    });
    expect(payload).not.toHaveProperty("daily_rate");
    expect(payload).not.toHaveProperty("price_details");
    expect(payload.price).toEqual("370.00");
  });

});
