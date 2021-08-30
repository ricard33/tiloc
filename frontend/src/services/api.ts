// Need to use the React-specific entry point to import createApi
import { BaseQueryFn, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Payment } from "../types/payment";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

export interface Pagination<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: "" }
  ): BaseQueryFn<{
    url: string
    method: AxiosRequestConfig["method"]
    data?: AxiosRequestConfig["data"]
  },
    unknown,
    unknown> =>
    async ({ url, method, data }) => {
      try {
        const result = await axios({ url: baseUrl + url, method, data });
        return { data: result.data };
      } catch (axiosError) {
        let err = axiosError as AxiosError;
        return {
          error: { status: err.response?.status, data: err.response?.data }
        };
      }
    };

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api/",
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Token ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ["Payment", "Booking"],
  endpoints: (builder) => ({
    getPaymentsForBooking: builder.query<Pagination<Payment>, number>({
      query: (bookingId) => `payment/?booking_id=${bookingId}`,
      providesTags: (data) =>
        // is result available?
        data
          ? // successful query
          [
            ...data.results.map(({ id }) => ({ type: "Payment", id: id } as const)),
            { type: "Payment", id: "LIST" }
          ]
          : // an error occurred, but we still want to refetch this query when `{ type: 'Payment', id: 'LIST' }` is invalidated
          [{ type: "Payment", id: "LIST" }]
    }),
    addPayment: builder.mutation<Payment, Partial<Payment>>({
      query(body) {
        return {
          url: `payment/`,
          method: "POST",
          body
        };
      },
      // Invalidates all Post-type queries providing the `LIST` id - after all, depending of the sort order,
      // that newly created post could show up in any lists.
      invalidatesTags: [{ type: "Payment", id: "LIST" }]
    }),
    deletePayment: builder.mutation<{ success: boolean; id: number }, number>({
      query(id) {
        return {
          url: `payment/${id}/`,
          method: "DELETE"
        };
      },
      // Invalidates all queries that subscribe to this Post `id` only.
      invalidatesTags: (result, error, id) => [{ type: "Payment", id }]
    })
  })
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetPaymentsForBookingQuery,
  useAddPaymentMutation,
  useDeletePaymentMutation
} = api;
