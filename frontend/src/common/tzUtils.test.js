import { parseISO } from "date-fns";
import { formatISO, shiftPickerDateToUTCDate, shiftUTCDateToLocalDate } from "./tzUtils";

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

  describe("shiftPickerDateToUTCDate() / shiftUTCDateToLocalDate()", () => {
    it("shiftPickerDateToUTCDate subtracts the picker's timezone offset", () => {
      const picker = new Date("2020-10-12T00:00:00");
      const utc = shiftPickerDateToUTCDate(picker);
      expect(utc.getTime()).toEqual(picker.getTime() - picker.getTimezoneOffset() * 60000);
    });

    it("is round-trippable with shiftUTCDateToLocalDate", () => {
      const picker = new Date("2020-10-12T09:30:00");
      const back = shiftUTCDateToLocalDate(shiftPickerDateToUTCDate(picker));
      expect(back.getTime()).toEqual(picker.getTime());
    });

    it("shiftUTCDateToLocalDate passes through a falsy value", () => {
      expect(shiftUTCDateToLocalDate(undefined)).toBeUndefined();
    });
  });
});
