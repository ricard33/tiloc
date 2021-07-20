export interface Pagination<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface Payment {
  id?: number;
  booking: number;
  description: string;
  amount: number;
  method: string;
  date: string;
}
