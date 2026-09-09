import { BookingStatus } from "../types";
import { getBookingStatus, getBookingStatuses, getIconAndBgColor, otaBranding } from "./statusUtils";

describe("Module statusUtils:", () => {
  describe("getBookingStatus()", () => {
    it("should return BookingStatus by its name", () => {
      expect(getBookingStatus("not available"))
        .toEqual(BookingStatus.NotAvailable)
    });
    it("falls back to NotAvailable for an unknown name", () => {
      const spy = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(getBookingStatus("bogus")).toEqual(BookingStatus.NotAvailable);
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
  describe("getBookingStatuses()", () => {
    it("should return a list of all statuses in correct order", () => {
      expect(getBookingStatuses())
        .toEqual([
          BookingStatus.NotAvailable,
          BookingStatus.Option,
          BookingStatus.ContractSent,
          BookingStatus.DepositPaid,
          BookingStatus.PaymentOnArrival,
          BookingStatus.Paid,
          BookingStatus.External,
        ])
    });
  });

  describe("getIconAndBgColor()", () => {
    it("returns the OTA branding for an external booking from a known channel", () => {
      const booking = { status: "external", source: { name: "Airbnb" } };
      expect(getIconAndBgColor(booking)).toBe(otaBranding["Airbnb"]);
    });

    it("returns the status colour for a regular booking", () => {
      const result = getIconAndBgColor({ status: "paid", source: null });
      expect(result.bgColor).toEqual(BookingStatus.Paid.color);
      expect(result.selectedBgColor).toBeTruthy();
    });

    it("falls back to the status colour when the external source is unknown", () => {
      const result = getIconAndBgColor({ status: "external", source: { name: "SomewhereElse" } });
      expect(result.bgColor).toEqual(BookingStatus.External.color);
    });
  });
});
