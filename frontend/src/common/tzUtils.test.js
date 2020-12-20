import { computeBookingPrice, DecimalPrecision } from "./priceUtils";
import { parseISO } from "date-fns";
import { formatISO } from "./tzUtils";

describe("Module tzUtils:", () => {

  describe("to iso convertion", ()=>{
    it("should ignore TZ for UTC+1", () => {
      const parsedDate = parseISO("2020-10-12");
      expect(formatISO(parsedDate)).toEqual("2020-10-12");

    })
    it("should ignore TZ for UTC-4", () => {
      const parsedDate = new Date("2020-10-12 00:00:00 GMT-04:00");
      expect(formatISO(parsedDate)).toEqual("2020-10-12");

    })
  })
});
