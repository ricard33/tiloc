// Need to use the React-specific entry point to import createApi
import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import { Pagination, Payment, Contract, Booking, Lodging, BookingStatus } from "../types";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import { api2Booking, api2Lodging, api2Payment } from "../types/models-convertion";
import { EndpointBuilder } from "@reduxjs/toolkit/dist/query/endpointDefinitions";

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
  ): BaseQueryFn<string | AxiosArgs, unknown, AxiosError, {}, AxiosQueryMeta> =>
    async (arg) => {
      const { url, method = "get", params = undefined, data = undefined } = typeof arg == "string" ? { url: arg } : arg;
      let meta: AxiosQueryMeta | undefined;
      const requestArgs: AxiosRequestConfig = { url: baseUrl + url, method, params, data };
      meta = { request: requestArgs };
      try {
        return await axios(requestArgs);
      } catch (axiosError) {
        let err = axiosError as AxiosError;
        return { error: err, meta };
      }
    };

interface BaseModel {
  id?: number;
}
type ApiModel = Record<string, any>;
type AxiosEndpointBuilder = EndpointBuilder<BaseQueryFn<string | AxiosArgs, unknown, AxiosError, {}, AxiosQueryMeta>, string, "api">;

function makeListApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T) {
  return builder.query<T[], Record<string, any>>({
    query: (params?) => {
      return {
        url,
        method: "GET",
        params
      }
    },
    providesTags: (data) => {
      return data ? [
        ...((data as T[]).map(({ id }) => ({ type: modelName, id: id } as const))),
        { type: modelName, id: "LIST" }
      ] : [{ type: modelName, id: "LIST" }];
    },
    transformResponse: (response) => {
      return (response as Pagination<ApiModel>).results.map(p => convertFromApi ? convertFromApi(p) : p as T);
    }
  });
}

function makePaginatedListApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T) {
  return builder.query<Pagination<T>, Record<string, any>>({
    query: (params?) => {
      return {
        url,
        method: "GET",
        params
      }
    },
    providesTags: (data) => data ? [
      ...(data as Pagination<T>).results.map(({ id }) => ({ type: modelName, id: id } as const)),
      { type: modelName, id: "LIST" }
    ] : [{ type: modelName, id: "LIST" }],
    ...(convertFromApi && {transformResponse: (response) => {
      return {
        ...response as Pagination<T>,
        results: (response as Pagination<ApiModel>).results.map(p => convertFromApi(p))
      };
    }})
  });
}

function makeGetApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T) {
  return builder.query<T, number>({
    query: (id) => `${url}${id}/`,
    providesTags: (data) => data ? [
      { type: modelName, id: data.id }
    ] : [],
    ...(convertFromApi && {transformResponse: (response) => convertFromApi(response as ApiModel)})
  });
}

function makeCreateApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T) {
  return builder.mutation<T, Partial<T>>({
    query(body) {
      return {
        url: url,
        method: "POST",
        data: body
      };
    },
    invalidatesTags: [{ type: modelName, id: "LIST" }],
    ...(convertFromApi && {transformResponse: (response) => {
      return convertFromApi(response as ApiModel);
    }})
  });
}

function makeUpdateApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T) {
  return builder.mutation<T, Partial<T>>({
    query(body) {
      return {
        url: `${url}${body.id}/`,
        method: "PUT",
        data: body
      };
    },
    invalidatesTags: (result, error, obj) => [{ type: modelName, id: obj.id }, { type: modelName, id: "LIST" }],
    ...(convertFromApi && {transformResponse: (response) => {
      return convertFromApi(response as ApiModel);
    }})
  });
}

function makeDeleteApi(builder: AxiosEndpointBuilder, url: string, modelName: string) {
  return builder.mutation<{ success: boolean; id: number }, number>({
    query(id) {
      return {
        url: `${url}${id}/`,
        method: "DELETE"
      };
    },
    invalidatesTags: (result, error, id) => [{ type: modelName, id }, { type: modelName, id: "LIST" }]
  });
}

function makeApi<T extends BaseModel>(url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T) {
  return {
    list: (builder: AxiosEndpointBuilder) => makeListApi<T>(builder, url, modelName, convertFromApi),
    pages: (builder: AxiosEndpointBuilder) => makePaginatedListApi<T>(builder, url, modelName, convertFromApi),
    get: (builder: AxiosEndpointBuilder) => makeGetApi<T>(builder, url, modelName, convertFromApi),
    create: (builder: AxiosEndpointBuilder) => makeCreateApi<T>(builder, url, modelName, convertFromApi),
    update: (builder: AxiosEndpointBuilder) => makeUpdateApi<T>(builder, url, modelName, convertFromApi),
    delete: (builder: AxiosEndpointBuilder) => makeDeleteApi(builder, url, modelName)

  };
}

const paymentApi = makeApi<Payment>("payment/", "Payment", api2Payment);
const bookingApi = makeApi<Booking>("booking/", "Booking", api2Booking);
const lodgingApi = makeApi<Lodging>("lodging/", "Lodging", api2Lodging);
const bookingStatusApi = makeApi<BookingStatus>("booking_status/", "BookingStatus");

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery({ baseUrl: serviceURL }),
  tagTypes: ["Payment", "Lodging", "Booking", "BookingStatus", "Contract", "ContractTemplate"],
  endpoints: (builder) => ({

    // BookingStatus
    listBookingStatuses: bookingStatusApi.list(builder),
    getBookingStatus: bookingStatusApi.get(builder),
    createBookingStatus: bookingStatusApi.create(builder),
    updateBookingStatus: bookingStatusApi.update(builder),
    deleteBookingStatus: bookingStatusApi.delete(builder),

    // Lodging
    listLodgings: lodgingApi.list(builder),
    getLodging: lodgingApi.get(builder),
    createLodging: lodgingApi.create(builder),
    updateLodging: lodgingApi.update(builder),
    deleteLodging: lodgingApi.delete(builder),

    // Booking
    listBookings: bookingApi.list(builder),
    listBookingsPaginated: bookingApi.pages(builder),
    getBooking: bookingApi.get(builder),
    createBooking: bookingApi.create(builder),
    updateBooking: bookingApi.update(builder),
    deleteBooking: bookingApi.delete(builder),

    // Payment
    getPaymentsForBooking: builder.query<Pagination<Payment>, number>({
      query: (bookingId) => `payment/?booking_id=${bookingId}`,
      providesTags: (data) => data ? [
        ...data.results.map(({ id }) => ({ type: "Payment", id: id } as const)),
        { type: "Payment", id: "LIST" }
      ] : [{ type: "Payment", id: "LIST" }],
      transformResponse: (response) => {
        return {
          ...response as Pagination<Payment>,
          results: (response as Pagination<ApiModel>).results.map(p => api2Payment(p))
        };
      }
    }),
    listPayments: paymentApi.list(builder),
    getPayment: paymentApi.get(builder),
    createPayment: paymentApi.create(builder),
    updatePayment: paymentApi.update(builder),
    deletePayment: paymentApi.delete(builder),

    // Contract
    getOrGenerateContract: builder.mutation<Contract, { bookingId: number, regenerate?: boolean }>({
      query({ bookingId, regenerate }) {
        return {
          url: `booking/${bookingId}/${regenerate ? "generate_contract" : "get_or_create_contract"}/`,
          method: "POST"
        };
      }
    })

  })
});


// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useListBookingStatusesQuery,
  useGetBookingStatusQuery,
  useCreateBookingStatusMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingStatusMutation,

  useListLodgingsQuery,
  useGetLodgingQuery,
  useCreateLodgingMutation,
  useUpdateLodgingMutation,
  useDeleteLodgingMutation,

  useListBookingsQuery,
  useListBookingsPaginatedQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,

  useGetPaymentsForBookingQuery,
  useGetPaymentQuery,
  useListPaymentsQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,

  useGetOrGenerateContractMutation

} = api;
