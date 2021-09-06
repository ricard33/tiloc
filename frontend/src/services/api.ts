// Need to use the React-specific entry point to import createApi
import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import { Pagination, Payment, Contract } from "../types";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

export const serviceURL = "/api/";

type AxiosArgs = {
    url: string
    method: AxiosRequestConfig["method"]
    params?: AxiosRequestConfig["params"]
    data?: AxiosRequestConfig["data"]
  }
type AxiosQueryMeta = { request: AxiosRequestConfig; response?: AxiosResponse }

const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: "" }
  ): BaseQueryFn<
    string | AxiosArgs,
    unknown,
    AxiosError,
    {},
    AxiosQueryMeta> =>
    async (arg) => {
      const { url, method = 'get', params = undefined, data = undefined } = typeof arg == 'string' ? { url: arg } : arg;
      let meta: AxiosQueryMeta | undefined
      const requestArgs: AxiosRequestConfig = { url: baseUrl + url, method, params, data };
      meta = { request: requestArgs }
      try {
        return await axios(requestArgs);
      } catch (axiosError) {
        let err = axiosError as AxiosError;
        return { error: err, meta };
      }
    };

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery({baseUrl: serviceURL}),
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
          data: body
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
