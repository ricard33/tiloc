import { Payment } from "./models";

export interface ApiPayment {
  id?: number;
  booking: number;
  description: string;
  amount: string;
  method: string;
  date: string;
}


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

