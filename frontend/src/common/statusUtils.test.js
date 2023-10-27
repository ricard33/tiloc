import { BookingStatus } from "../types";
import { getBookingStatus, getBookingStatuses } from "./statusUtils";

describe("Module statusUtils:", () => {
  describe("getBookingStatus()", () => {
    it("should return BookingStatus by its name", () => {
      expect(getBookingStatus("not available"))
        .toEqual(BookingStatus.NotAvailable)
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
});
