import "typeface-roboto";
import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import App from "./App";
import { auth as authActions } from "./actions";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import rootSaga from "./sagas";
import { store, sagaMiddleware } from "./store";
import "./index.css";
import { createBrowserHistory } from "history";
import logger from "./common/logger";
import { SnackbarProvider } from 'notistack';
import { dispatchError } from "./common/alertUtils";

const browserHistory = createBrowserHistory();

sagaMiddleware.run(rootSaga);


// Add a request interceptor
axios.interceptors.request.use(
  function(config) {
    // Do something before request is sent
    const token = localStorage.getItem("token");
    if (token) {
      if (typeof config.headers === 'undefined')
        config.headers = {};
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  }, function(error) {
    // Do something with request error
    logger.error(error);
    return Promise.reject(error);
  });

// Response interceptor.
axios.interceptors.response.use(
  function(response) {
    // Do something with response data
    // console.debug("set-cookie", response.headers["set-cookie"]);
    return response;
  },
  function(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(error.config.method + " " + error.config.url + " => Code " + error.response.status, error.response.data);

      if (error.response.status === 401) {
        if (["/login", "/logged-out"].indexOf(browserHistory.location.pathname) < 0) {
          const location = { ...browserHistory.location };
          dispatchError(error.response.data.detail);
          store.dispatch(authActions.tokenExpired());
          console.warn("Push to /login from", location);
          browserHistory.push("/login", { from: location });
        }
        else
          return Promise.reject(error);
      }
      if (error.response.data.detail)
        dispatchError(error.response.data.detail);
      else
        dispatchError("Server error");

    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
      dispatchError("No response from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Request error", error.message);
      dispatchError("Request error");
    }
    console.debug(error.config);
    return Promise.reject(error);
  }
);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SnackbarProvider maxSnack={3}>
          <App history={browserHistory}/>
        </SnackbarProvider>
      </I18nextProvider>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals(console.log);
