import { RootState } from "../store";
import { Pagination, Payment } from "../types";

export const initialState: Partial<RootState> = {
  auth: {
    isLoading: false,
    isAuthenticated: false,
  },
  api: {
    queries: {},
    mutations: {},
    provided: { Payment: {}, Booking: {}, Contract: {}, ContractTemplate: {}, Lodging: {}, BookingStatus: {},
      BookingChannel: {}, Service: {} },
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

export const payment: Payment = {
  id: 1,
  booking: 22,
  amount: 0,
  date: "2021-01-15",
  description: "",
  method: "cash",
}

export const paymentsList: Pagination<Payment> = {
  count: 1,
  results: [payment]
}


export const newPayment: Payment = {
  booking: 22,
  amount: 0,
  date: "2021-01-15",
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
