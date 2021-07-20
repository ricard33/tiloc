import axios from "axios";
import { makeApi, Pagination } from "./models";

export interface ApiPayment {
  id?: number;
  booking: number;
  description: string;
  amount: string;
  method: string;
  date: string;
}

export interface Payment {
  id?: number;
  booking: number;
  description: string;
  amount: number;
  method: string;
  date: string;
}

export const paymentMethods = (t: (key: string) => string) => {
  return [
    ["cash", t("Cash")],
    ["bank_card", t("Bank card")],
    ["check", t("Check")],
    ["transfer", t("Transfer")],
    ["paypal", t("PayPal")],
    ["vouchers", t("Holiday vouchers")],
    ["other", t("Other")]
  ];
};

export function api2Payment(p: ApiPayment): Payment {
  return {
    ...p,
    amount: Number(p.amount)
  };
}

export function payment2Api(p: Payment): ApiPayment {
  return {
    ...p,
    amount: p.amount.toFixed(2)
  };
}

export const paymentApi = makeApi<ApiPayment, Payment>("/api/payment", api2Payment, payment2Api);

export function getForBooking(bookingId: number): Promise<Pagination<Payment>> {
  return axios.get<Pagination<ApiPayment>>(`/api/payment/?booking_id=${bookingId}`)
    .then(response => {
      return {
        ...response.data,
        results: response.data.results.map(api2Payment)
      };
    });
}
