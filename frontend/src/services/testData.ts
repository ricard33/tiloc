import { RootState } from "../store";
import { Pagination } from "../types";
import { parseISO } from "date-fns";

export const initialState: Partial<RootState> = {
  auth: {
    isLoading: false,
    isAuthenticated: false,
  },
  api: {
    queries: {},
    mutations: {},
    provided: {
      Payment: {}, User: {}, Booking: {}, Contract: {}, ContractTemplate: {}, Lodging: {},
      BookingStatus: {}, BookingChannel: {}, Service: {}
    },
    subscriptions: {},
    config: {
      refetchOnFocus: false,
      refetchOnMountOrArgChange: false,
      refetchOnReconnect: false,
      online: true,
      focused: true,
      middlewareRegistered: false,
      reducerPath: "api",
      keepUnusedDataFor: 60,
    },
  },
};

export const payment: Record<string, any> = {
  id: 1,
  booking: 22,
  amount: 0,
  date: parseISO("2021-01-15"),
  description: "",
  method: "cash",
}

export const paymentREST: Record<string, any> = {
  id: 1,
  booking: 22,
  amount: 0,
  date: "2021-01-15",
  description: "",
  method: "cash",
}

export const paymentsList: Pagination<Record<string, any>> = {
  count: 1,
  results: [paymentREST]
}


export const newPayment: Record<string, any> = {
  booking: 22,
  amount: 0,
  date: parseISO("2021-01-15"),
  // date: "2021-01-15",
  description: "",
  method: "cash",
}

// export const newGame: NewGame = {
//   name: "Game",
//   description: "Description",
//   private: false,
//   variant: "Classical",
// };
//
// export const game: Game = {
//   ...newGame,
//   finished: false,
//   id: "",
//   started: false,
//   createdAt: "",
//   startedAt: "",
//   finishedAt: "",
// };
//
// export const variant: Variant = {
//   name: "Classical",
//   createdBy: "Player",
//   description: "Description",
//   orderTypes: [],
// };
