import { computeBookingPrice, DecimalPrecision } from "./priceUtils";

describe("Module priceUtils:", () => {
  describe("computeBookingPrice()", () => {
    it("should compute price based on default daily rate for short stay", () => {
      expect(computeBookingPrice("2020-03-14", "2020-03-17",
        55, 0, 350, [], 30))
        .toEqual({
          price: 165,  // 3 x 55 = 165
          deposit: 50,
          daily_rate: 55,
          price_details: [
            {
              begin_date: "2020-03-14",
              end_date: "2020-03-17",
              day_count: 3,
              rate_name: null,
              is_week_rate: false
            }]
        });
    });
    it("should compute price based on default weekly rate for longer stay", () => {
      expect(computeBookingPrice("2020-03-14", "2020-04-02",
        55, 0, 350, [], 30))
        .toEqual({
          price: 950,   // 2 x 350 + 5 x (350 / 7) = 950
          deposit: 285,
          daily_rate: 50,
          price_details: [
            {
              begin_date: "2020-03-14",
              end_date: "2020-04-02",
              day_count: 19,
              rate_name: null,
              is_week_rate: true
            }]
        });
    });
  });

  describe("Decimal precision", ()=>{
    it("should rounding value with 2 digit precision", () => {
      expect(DecimalPrecision.round(1.005)).toEqual(1.01);
      expect(DecimalPrecision.ceil(1.005)).toEqual(1.01);
      expect(DecimalPrecision.floor(1.005)).toEqual(1.00);
      expect(DecimalPrecision.round(1.0049999)).toEqual(1.00);
      expect(DecimalPrecision.ceil(1.0049999)).toEqual(1.01);
      expect(DecimalPrecision.floor(1.0049999)).toEqual(1.00);
      expect(DecimalPrecision.round(2.175495134384,7)).toEqual(2.1754951);
      expect(DecimalPrecision.round(2.1753543549,8)).toEqual(2.17535435);
      expect(DecimalPrecision.round(2.1755465135353,4)).toEqual(2.1755);

    })
  })
});
