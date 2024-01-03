import "typeface-roboto";
import React from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import App from "./App";
import { auth as authActions } from "./actions";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import rootSaga from "./sagas";
import { sagaMiddleware, store } from "./store";
import "./index.css";
import { createBrowserHistory } from "history";
import logger from "./common/logger";
import { SnackbarProvider } from "notistack";
import { dispatchError } from "./common/alertUtils";
import "vite/modulepreload-polyfill";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { getCookie } from "./common/cookies";

const browserHistory = createBrowserHistory();

sagaMiddleware.run(rootSaga);

// Add a request interceptor
axios.interceptors.request.use(
  function (config) {
    // Do something before request is sent
    // console.log("axios.interceptors.request", config)
    if (typeof config.headers === "undefined") config.headers = {};

    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }

    const csrftoken = getCookie("csrftoken");
    if (csrftoken) {
      config.headers["X-CSRFToken"] = csrftoken;
    }

    return config;
  },
  function (error) {
    // Do something with request error
    logger.error(error);
    return Promise.reject(error);
  }
);

// Response interceptor.
axios.interceptors.response.use(
  function (response) {
    // Do something with response data
    // console.debug("set-cookie", response.headers["set-cookie"]);
    return response;
  },
  function (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(
        error.config.method + " " + error.config.url + " => Code " + error.response.status,
        error.response.data
      );

      if (error.response.status === 401) {
        if (["/login", "/logged-out"].indexOf(browserHistory.location.pathname) < 0) {
          // const location = { ...browserHistory.location };
          // dispatchError(error.response.data.detail);
          store.dispatch(authActions.tokenExpired());
          // console.warn("Push to /login from", location);
          // browserHistory.push("/login", { from: location });
        } else return Promise.reject(error);
      } else {
        if (error.response.data.detail) dispatchError(error.response.data.detail);
        else if(error.response.data instanceof Blob) {
          error.response.data.text().then((content: string) => {
            const data = JSON.parse(content);
            if (data.detail) dispatchError(data.detail);
            else dispatchError(data);
          })
        }
        else dispatchError("Server error");
      }
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

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
}

const logError = (error: Error, info: { componentStack: string }) => {
  // Do something with the error, e.g. log to an external API
  logger.error(error, info);
};

const root = createRoot(document.getElementById("root")!);
root.render(
  // <React.StrictMode>
  <ErrorBoundary FallbackComponent={ErrorFallback} onError={logError}>
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <SnackbarProvider maxSnack={3}>
          <App />
        </SnackbarProvider>
      </I18nextProvider>
    </Provider>
  </ErrorBoundary>
  // </React.StrictMode>
);
