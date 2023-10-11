// Need to use the React-specific entry point to import createApi
import { BaseQueryFn, createApi } from "@reduxjs/toolkit/query/react";
import {
  Booking,
  BookingChannel,
  BookingStatus,
  CalendarSync,
  Comment,
  Contract,
  ContractTemplate,
  Guest,
  Lodging,
  LoginInfo,
  NextEvent,
  Pagination,
  Payment,
  Property,
  Service,
  User
} from "../types";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";
import {
  api2Booking,
  api2CalendarSync, api2Comment,
  api2Contract,
  api2ContractTemplate,
  api2Lodging,
  api2Payment,
  api2Property,
  api2Service,
  booking2api, comment2Api,
  payment2Api,
  property2api
} from "../types/models-convertion";
import { EndpointBuilder } from "@reduxjs/toolkit/dist/query/endpointDefinitions";

export const serviceURL = "/api/";

type AxiosArgs = {
  url: string
  method: AxiosRequestConfig["method"]
  params?: AxiosRequestConfig["params"]
  data?: AxiosRequestConfig["data"]
}
type AxiosQueryMeta = { request: AxiosRequestConfig; response?: AxiosResponse }

// Error types
// -----------
export interface ApiError {
  detail: string;
}

export interface ValidationError {
  [field: string]: string[];
}

export type QueryError = {
  message: string;
  status?: number;
  data?: ApiError | ValidationError;
  meta?: AxiosQueryMeta;
}
const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: "" }
  ): BaseQueryFn<string | AxiosArgs, unknown, QueryError, {}, AxiosQueryMeta> =>
    async (arg) => {
      const { url, method = "get", params = undefined, data = undefined } = typeof arg == "string" ? { url: arg } : arg;
      let meta: AxiosQueryMeta;
      const requestArgs: AxiosRequestConfig = { url: baseUrl + url, method, params, data };
      if(method.toLowerCase() === "put" || method.toLowerCase() === "patch" || method.toLowerCase() === "post") {
        let form_data = new FormData();
        let fileUpload = false;
        for (var propertyName in data) {
          // propertyName is what you want
          // you can get the value like this: myObject[propertyName]
          if (data.hasOwnProperty(propertyName)) {
            let value = data[propertyName];

            if (FileList && value instanceof FileList) {
              // Safari, Firefox, IE land here
              fileUpload = true;
              if(value.length > 0)
                form_data.append(propertyName, value[0], value[0].name);
            }
            else
              form_data.append(propertyName, value)
          }
        }
        if(fileUpload) {
          requestArgs.data = form_data;
          requestArgs.headers = {"Content-Type": "multipart/form-data"}
        }
      }
      meta = { request: requestArgs };
      try {
        const result = await axios(requestArgs);
        return { data: result.data };
      } catch (axiosError) {
        let err = axiosError as AxiosError;
        if(err.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          return {
            error: {
              message: typeof err.response?.data === 'string' ? err.response?.data
                : typeof err.response?.data === 'object' ? JSON.stringify(err.response?.data)
                  : err.response?.statusText,
              status: err.response?.status,
              data: err.response?.data,
              meta
            }
          };
        } else if (err.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.error("Error sending request: ", err.request);
          return { error: { message: err.code ?? err.message, meta } };
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Error', err.message);
          return { error: { message: err.code ?? err.message, meta } };
        }
      }
    };

export interface BaseModel {
  id?: number;
}
type ApiModel = Record<string, any>;
type AxiosEndpointBuilder = EndpointBuilder<BaseQueryFn<string | AxiosArgs, unknown, QueryError, {}, AxiosQueryMeta>, string, "api">;

function invalidatesDependentTags<T extends BaseModel>(modelName: string, obj: T) {
  if(modelName === "Comment")
    return [{ type: "Booking", id: (obj as any as Comment).booking_id }, { type: "Booking", id: "LIST" }]
  return []
}

function makeListApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T) {
  return builder.query<T[], Record<string, any> | void>({
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

function makeCreateApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string,
  convertFromApi?: (obj: ApiModel) => T, convertToApi?: (obj: Partial<T>) => ApiModel) {
  return builder.mutation<T, Partial<T>>({
    query(body) {
      return {
        url: url,
        method: "POST",
        data: convertToApi ? convertToApi(body) : body
      };
    },
    invalidatesTags: (result, error, obj) => [
      { type: modelName, id: "LIST" },
      ...invalidatesDependentTags(modelName, obj)
    ],
    ...(convertFromApi && {transformResponse: (response) => {
      return convertFromApi(response as ApiModel);
    }})
  });
}

function makeUpdateApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string,
  convertFromApi?: (obj: ApiModel) => T, convertToApi?: (obj: Partial<T>) => ApiModel) {
  return builder.mutation<T, Partial<T>>({
    query(body) {
      return {
        url: `${url}${body.id}/`,
        method: "PATCH",
        data: convertToApi ? convertToApi(body) : body
      };
    },
    invalidatesTags: (result, error, obj) => [
      { type: modelName, id: obj.id },
      { type: modelName, id: "LIST" },
      ...invalidatesDependentTags(modelName, obj)
    ],
    ...(convertFromApi && {transformResponse: (response) => {
      return convertFromApi(response as ApiModel);
    }})
  });
}

function makeDeleteApi<T extends BaseModel>(builder: AxiosEndpointBuilder, url: string, modelName: string) {
  return builder.mutation<{ success: boolean; id: number }, Partial<T>>({
    query(body) {
      return {
        url: `${url}${body.id}/`,
        method: "DELETE"
      };
    },
    invalidatesTags: (result, error, obj) => [
      // { type: modelName, id: obj.id },
      { type: modelName, id: "LIST" },
      ...invalidatesDependentTags(modelName, obj)
    ]
  });
}

function makeApi<T extends BaseModel>(url: string, modelName: string, convertFromApi?: (obj: ApiModel) => T, convertToApi?: (obj: Partial<T>) => ApiModel) {
  return {
    list: (builder: AxiosEndpointBuilder) => makeListApi<T>(builder, url, modelName, convertFromApi),
    pages: (builder: AxiosEndpointBuilder) => makePaginatedListApi<T>(builder, url, modelName, convertFromApi),
    get: (builder: AxiosEndpointBuilder) => makeGetApi<T>(builder, url, modelName, convertFromApi),
    create: (builder: AxiosEndpointBuilder) => makeCreateApi<T>(builder, url, modelName, convertFromApi, convertToApi),
    update: (builder: AxiosEndpointBuilder) => makeUpdateApi<T>(builder, url, modelName, convertFromApi, convertToApi),
    delete: (builder: AxiosEndpointBuilder) => makeDeleteApi(builder, url, modelName)

  };
}

const paymentApi = makeApi<Payment>("payment/", "Payment", api2Payment, payment2Api);
const commentApi = makeApi<Comment>("comment/", "Comment", api2Comment, comment2Api);
const bookingApi = makeApi<Booking>("booking/", "Booking", api2Booking, booking2api);
const lodgingApi = makeApi<Lodging>("lodging/", "Lodging", api2Lodging);
const userApi = makeApi<User>("user/", "User");
const propertyApi = makeApi<Property>("property/", "Property", api2Property, property2api);
const bookingStatusApi = makeApi<BookingStatus>("booking_status/", "BookingStatus");
const bookingChannelApi = makeApi<BookingChannel>("booking_channel/", "BookingChannel");
const contractTemplateApi = makeApi<ContractTemplate>("contract_template/", "ContractTemplate", api2ContractTemplate);
const contractApi = makeApi<Contract>("contract/", "Contract", api2Contract);
const serviceApi = makeApi<Service>("service/", "Service", api2Service);
const calendarSyncApi = makeApi<CalendarSync>("booking_channel_sync/", "CalendarSync", api2CalendarSync);

// Define a service using a base URL and expected endpoints
export const api = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery({ baseUrl: serviceURL }),
  tagTypes: [
    "Payment",
    "Property",
    "Lodging",
    "Comment",
    "Booking",
    "BookingStatus",
    "BookingChannel",
    "CalendarSync",
    "Contract",
    "ContractTemplate",
    "Service",
    "User"
  ],
  // keepUnusedDataFor: 5,
  endpoints: (builder) => ({
    // Sign in
    currentUser: builder.query<User, void>({
      query: () => `auth/user/`
    }),
    login: builder.mutation<LoginInfo, { email: string; password: string }>({
      query(args) {
        return {
          url: `auth/login/`,
          method: "POST",
          data: args
        };
      }
    }),
    logout: builder.mutation<LoginInfo, void>({
      query() {
        return {
          url: `auth/logout/`,
          method: "POST"
        };
      }
    }),
    signup: builder.mutation<LoginInfo, { first_name: string, last_name: string, email: string; password: string }>({
      query(args) {
        return {
          url: `signup/`,
          method: "POST",
          data: args
        };
      }
    }),

    // BookingStatus
    listBookingStatuses: bookingStatusApi.list(builder),
    getBookingStatus: bookingStatusApi.get(builder),
    createBookingStatus: bookingStatusApi.create(builder),
    updateBookingStatus: bookingStatusApi.update(builder),
    deleteBookingStatus: bookingStatusApi.delete(builder),
    moveUpBookingStatus: builder.mutation<BookingStatus, { statusId: number }>({
      query: ({ statusId }) => {
        return { url: `booking_status/${statusId}/move_up/`, method: "POST" };
      }
    }),
    moveDownBookingStatus: builder.mutation<BookingStatus, { statusId: number }>({
      query: ({ statusId }) => {
        return { url: `booking_status/${statusId}/move_down/`, method: "POST" };
      }
    }),

    // BookingChannel
    listBookingChannels: bookingChannelApi.list(builder),
    getBookingChannel: bookingChannelApi.get(builder),
    createBookingChannel: bookingChannelApi.create(builder),
    updateBookingChannel: bookingChannelApi.update(builder),
    deleteBookingChannel: bookingChannelApi.delete(builder),

    // user
    listUsers: userApi.list(builder),
    getUser: userApi.get(builder),
    createUser: userApi.create(builder),
    updateUser: userApi.update(builder),
    deleteUser: userApi.delete(builder),

    // property
    listProperties: propertyApi.list(builder),
    getProperty: propertyApi.get(builder),
    createProperty: propertyApi.create(builder),
    updateProperty: propertyApi.update(builder),
    deleteProperty: propertyApi.delete(builder),

    // Lodging
    listLodgings: lodgingApi.list(builder),
    getLodging: lodgingApi.get(builder),
    createLodging: lodgingApi.create(builder),
    updateLodging: lodgingApi.update(builder),
    deleteLodging: lodgingApi.delete(builder),
    moveUpLodging: builder.mutation<Lodging, { lodgingId: number }>({
      query: ({ lodgingId }) => {
        return { url: `lodging/${lodgingId}/move_up/`, method: "POST" };
      }
    }),
    moveDownLodging: builder.mutation<Lodging, { lodgingId: number }>({
      query: ({ lodgingId }) => {
        return { url: `lodging/${lodgingId}/move_down/`, method: "POST" };
      }
    }),

    // Booking
    listBookings: bookingApi.list(builder),
    listBookingsPaginated: bookingApi.pages(builder),
    getBooking: bookingApi.get(builder),
    createBooking: bookingApi.create(builder),
    updateBooking: bookingApi.update(builder),
    deleteBooking: bookingApi.delete(builder),
    allGuests: builder.query<Guest[], void>({
      query: () => "booking/all_guests/"
    }),
    nextEvents: builder.query<NextEvent[], number>({
      query: (count) => "booking/next_events/?count=" + count
    }),

    // Payment
    getPaymentsForBooking: builder.query<Pagination<Payment>, number>({
      query: (bookingId) => `payment/?booking_id=${bookingId}`,
      providesTags: (data) =>
        data
          ? [...data.results.map(({ id }) => ({ type: "Payment", id: id } as const)), { type: "Payment", id: "LIST" }]
          : [{ type: "Payment", id: "LIST" }],
      transformResponse: (response) => {
        return {
          ...(response as Pagination<Payment>),
          results: (response as Pagination<ApiModel>).results.map((p) => api2Payment(p))
        };
      }
    }),
    listPayments: paymentApi.list(builder),
    listPaymentsPaginated: paymentApi.pages(builder),
    getPayment: paymentApi.get(builder),
    createPayment: paymentApi.create(builder),
    updatePayment: paymentApi.update(builder),
    deletePayment: paymentApi.delete(builder),

    createComment: commentApi.create(builder),
    updateComment: commentApi.update(builder),
    deleteComment: commentApi.delete(builder),

    // Contract
    getOrGenerateContract: builder.mutation<Contract, { bookingId: number; regenerate?: boolean }>({
      query({ bookingId, regenerate }) {
        return {
          url: `booking/${bookingId}/${regenerate ? "generate_contract" : "get_or_create_contract"}/`,
          method: "POST"
        };
      }
    }),
    listContracts: contractApi.list(builder),
    getContract: contractApi.get(builder),
    createContract: contractApi.create(builder),
    updateContract: contractApi.update(builder),
    deleteContract: contractApi.delete(builder),

    // Contract template
    listContractTemplates: contractTemplateApi.list(builder),
    getContractTemplate: contractTemplateApi.get(builder),
    createContractTemplate: contractTemplateApi.create(builder),
    updateContractTemplate: contractTemplateApi.update(builder),
    deleteContractTemplate: contractTemplateApi.delete(builder),

    // Services
    listServices: serviceApi.list(builder),
    getService: serviceApi.get(builder),
    createService: serviceApi.create(builder),
    updateService: serviceApi.update(builder),
    deleteService: serviceApi.delete(builder),

    // Calendar sync
    listCalendarSyncs: calendarSyncApi.list(builder),
    getCalendarSync: calendarSyncApi.get(builder),
    createCalendarSync: calendarSyncApi.create(builder),
    updateCalendarSync: calendarSyncApi.update(builder),
    deleteCalendarSync: calendarSyncApi.delete(builder)
  })
});


// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useCurrentUserQuery,
  useLoginMutation,
  useLogoutMutation,
  useSignupMutation,

  useListBookingStatusesQuery,
  useGetBookingStatusQuery,
  useCreateBookingStatusMutation,
  useUpdateBookingStatusMutation,
  useDeleteBookingStatusMutation,
  useMoveUpBookingStatusMutation,
  useMoveDownBookingStatusMutation,

  useListBookingChannelsQuery,
  useGetBookingChannelQuery,
  useCreateBookingChannelMutation,
  useUpdateBookingChannelMutation,
  useDeleteBookingChannelMutation,

  useListUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,

  useListPropertiesQuery,
  useGetPropertyQuery,
  useCreatePropertyMutation,
  useUpdatePropertyMutation,
  useDeletePropertyMutation,

  useListLodgingsQuery,
  useGetLodgingQuery,
  useCreateLodgingMutation,
  useUpdateLodgingMutation,
  useDeleteLodgingMutation,
  useMoveUpLodgingMutation,
  useMoveDownLodgingMutation,

  useListBookingsQuery,
  useListBookingsPaginatedQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useDeleteBookingMutation,
  useAllGuestsQuery,
  useNextEventsQuery,

  useGetPaymentsForBookingQuery,
  useLazyGetPaymentsForBookingQuery,
  useGetPaymentQuery,
  useLazyGetPaymentQuery,
  useListPaymentsQuery,
  useLazyListPaymentsQuery,
  useListPaymentsPaginatedQuery,
  useCreatePaymentMutation,
  useUpdatePaymentMutation,
  useDeletePaymentMutation,

  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,

  useGetOrGenerateContractMutation,
  useGetContractQuery,
  useListContractsQuery,
  useCreateContractMutation,
  useUpdateContractMutation,
  useDeleteContractMutation,

  useGetContractTemplateQuery,
  useListContractTemplatesQuery,
  useCreateContractTemplateMutation,
  useUpdateContractTemplateMutation,
  useDeleteContractTemplateMutation,

  useGetServiceQuery,
  useListServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,

  useGetCalendarSyncQuery,
  useListCalendarSyncsQuery,
  useCreateCalendarSyncMutation,
  useUpdateCalendarSyncMutation,
  useDeleteCalendarSyncMutation,

} = api;
