import * as reducers from "./reducers";
import { createReducer } from "redux-orm";
import createSagaMiddleware from "redux-saga";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./services/api";
import orm from "./orm";

export const sagaMiddleware = createSagaMiddleware();
export const store = configureStore({
  reducer: {
    alert: reducers.alert,
    auth: reducers.auth,
    fetching: reducers.fetching,
    // @ts-ignore
    entities: createReducer(orm),
    [api.reducerPath]: api.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat([sagaMiddleware, api.middleware])

});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);
