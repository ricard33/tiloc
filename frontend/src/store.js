import { applyMiddleware, combineReducers, compose, createStore } from "redux";
import * as reducers from "./reducers";
import { createReducer } from "redux-orm";
import createSagaMiddleware from "redux-saga";

export function createFullStore(orm) {
  const rootReducer = combineReducers({
    alert: reducers.alert,
    auth: reducers.auth,
    fetching: reducers.fetching,
    entities: createReducer(orm)
  });

  const composeEnhancers = (typeof window !== "undefined" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(rootReducer, composeEnhancers(applyMiddleware(sagaMiddleware)));
  return { sagaMiddleware, store };
}
