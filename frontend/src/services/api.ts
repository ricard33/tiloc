// Need to use the React-specific entry point to import createApi
import { BaseQueryFn, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Headers, Pagination, Payment, Contract } from "../types";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

export const serviceURL = "/api/";

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
    baseUrl: serviceURL,
    prepareHeaders: (headers, { getState }) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set(Headers.Authorization, `Token ${token}`);
      }
      headers.set(Headers.Accept, "application/json");
      return headers;
    }
  }),
  tagTypes: ["Payment", "Booking", "Contract", "ContractTemplate"],
  endpoints: (builder) => ({

    // Payment
    listPayments: builder.query<Pagination<Payment>, undefined>({
      query: () => "payment/",
      providesTags: (data) => data ? [
        ...data.results.map(({ id }) => ({ type: "Payment", id: id } as const)),
        { type: "Payment", id: "LIST" }
      ] : [{ type: "Payment", id: "LIST" }],
      transformResponse: (response) => {
        return {
          ...response as Pagination<Payment>,
          results: (response as Pagination<Payment>).results.map(p => {
            return { ...p, amount: Number(p.amount) };
          })
        };
      }
    }),
    getPaymentsForBooking: builder.query<Pagination<Payment>, number>({
      query: (bookingId) => `payment/?booking_id=${bookingId}`,
      providesTags: (data) => data ? [
        ...data.results.map(({ id }) => ({ type: "Payment", id: id } as const)),
        { type: "Payment", id: "LIST" }
      ] : [{ type: "Payment", id: "LIST" }],
      transformResponse: (response) => {
        return {
          ...response as Pagination<Payment>,
          results: (response as Pagination<Payment>).results.map(p => {
            return { ...p, amount: Number(p.amount) };
          })
        };
      }
    }),
    createPayment: builder.mutation<Payment, Partial<Payment>>({
      query(body) {
        return {
          url: `payment/`,
          method: "POST",
          body
        };
      },
      invalidatesTags: [{ type: "Payment", id: "LIST" }]
    }),
    deletePayment: builder.mutation<{ success: boolean; id: number }, number>({
      query(id) {
        return {
          url: `payment/${id}/`,
          method: "DELETE"
        };
      },
      invalidatesTags: (result, error, id) => [{ type: "Payment", id }]
    }),

    // Contract
    getOrGenerateContract: builder.mutation<Contract, { bookingId: number, regenerate?: boolean }>({
      query({ bookingId, regenerate }) {
        return {
          url: `booking/${bookingId}/${regenerate ? "generate_contract" : "get_or_create_contract"}/`,
          method: "POST",
        };
      },
    }),
    // generateContract: builder.mutation<Contract, number>({
    //   query(bookingId) {
    //     return {
    //       url: `booking/${bookingId}/generate_contract/`,
    //       method: "POST",
    //     };
    //   },
    // }),

  })
});

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useListPaymentsQuery,
  useGetPaymentsForBookingQuery,
  useCreatePaymentMutation,
  useDeletePaymentMutation,
  useGetOrGenerateContractMutation,

} = api;
