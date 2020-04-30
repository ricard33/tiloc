import { computeBookingPrice } from "./priceUtils";

describe("Module priceUtils:", () => {
  describe("computeBookingPrice()", () => {
    it("should compute price based on default daily rate for short stay", () => {
      expect(computeBookingPrice("2020-03-14", "2020-03-17",
        55, 0, 350, []))
        .toEqual({
          price: 165,  // 3 x 55 = 165
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
        55, 0, 350, []))
        .toEqual({
          price: 950,   // 2 x 350 + 5 x (350 / 7) = 950
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
});
