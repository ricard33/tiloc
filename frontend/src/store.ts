import * as reducers from "./reducers";
import createSagaMiddleware from "redux-saga";
import { configureStore, isPlain } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./services/api";
import { isDate } from "date-fns";
// import { rtkQueryErrorLogger } from "./services/middlewares";

export const sagaMiddleware = createSagaMiddleware();
export const store = configureStore({
  reducer: {
    alert: reducers.alert,
    auth: reducers.auth,
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware(
      {
        serializableCheck: {
          // HACK: Date serialization is working well but is not permitted by RTK because Date is mutable.
          isSerializable: (value: any) => isDate(value) || isPlain(value)
        }
      }
    ).concat([sagaMiddleware, /*rtkQueryErrorLogger, */api.middleware])

});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);
