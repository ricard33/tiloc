import {
  formatDate,
  formatDistanceToNow,
  formatISODate,
  getMonthName,
  getWeekdayName,
  isValidDate,
} from "./dateUtils";
import { parseISO } from "date-fns";

// Note: under the test i18n setup the effective date-fns locale falls back to en-US,
// so assertions here stay locale-agnostic.

describe("Module dateUtils:", () => {
  const date = parseISO("2024-01-15"); // a Monday

  describe("isValidDate()", () => {
    it("accepts a real Date", () => {
      expect(isValidDate(new Date())).toBe(true);
    });
    it("rejects an Invalid Date, a number, a string and null", () => {
      expect(isValidDate(new Date("nope"))).toBe(false);
      expect(isValidDate(1700000000000)).toBe(false);
      expect(isValidDate("2024-01-15")).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });
  });

  describe("formatDate()", () => {
    it("formats a valid date using the locale", () => {
      expect(formatDate(date)).toMatch(/2024/);
    });
    it("honours a custom format string", () => {
      expect(formatDate(date, "yyyy-MM-dd")).toEqual("2024-01-15");
    });
    it("returns an empty string for an invalid date", () => {
      expect(formatDate(new Date("nope"))).toEqual("");
    });
  });

  describe("formatISODate()", () => {
    it("formats as yyyy/MM/dd", () => {
      expect(formatISODate(date)).toEqual("2024/01/15");
    });
    it("returns an empty string for an invalid date", () => {
      expect(formatISODate(new Date("nope"))).toEqual("");
    });
  });

  describe("formatDistanceToNow()", () => {
    it("returns a suffixed relative string", () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
      expect(formatDistanceToNow(twoHoursAgo)).toMatch(/(il y a|ago)/);
    });
    it("returns an empty string for an invalid date", () => {
      expect(formatDistanceToNow(new Date("nope"))).toEqual("");
    });
  });

  describe("getMonthName() / getWeekdayName()", () => {
    it("returns the month name (locale-dependent)", () => {
      expect(getMonthName(date).toLowerCase()).toMatch(/^jan/);
    });
    it("returns the narrow weekday name", () => {
      expect(getWeekdayName(date)).toBeTruthy();
    });
  });
});
