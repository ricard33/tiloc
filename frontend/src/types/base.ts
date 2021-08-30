// Request headers
export enum Headers {
  Authorization = "authorization",
  Accept = "Accept",
}

export interface Pagination<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
