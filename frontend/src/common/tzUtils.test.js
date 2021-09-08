import { parseISO } from "date-fns";
import { formatISO } from "./tzUtils";

describe("Module tzUtils:", () => {

  describe("to iso conversion", ()=>{
    it("should ignore TZ for localtime", () => {
      const parsedDate = parseISO("2020-10-12");
      expect(formatISO(parsedDate)).toEqual("2020-10-12");

    })
    // Date are always in LocalTime
    it("should work for positive TZ", () => {
      const parsedDate = new Date("2020-10-12 01:00:00");
      expect(formatISO(parsedDate)).toEqual("2020-10-12");

    })
    it("should work for negative TZ", () => {
      const parsedDate = new Date("2020-10-12 23:00:00");
      expect(formatISO(parsedDate)).toEqual("2020-10-12");

    })
  })

  describe("from iso conversion", ()=>{
    it("should ignore TZ", () => {
      const parsedDate = parseISO("2020-10-12");
      expect(parsedDate.getDate()).toEqual(12);

    })
  })
});
