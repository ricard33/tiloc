import { BookingStatus } from "../types";

export const getBookingStatus = (name: string) => {
  for (var key in BookingStatus) {
    const status = (BookingStatus as any)[key] as BookingStatus;
    if (status.name === name)
      return status;
  }
  console.error(`Status "${name}" not found!`);
  return BookingStatus.NotAvailable;
}

export const getBookingStatuses = () => {
  return Object.keys(BookingStatus).map(name => (BookingStatus as any)[name] as BookingStatus)
};
