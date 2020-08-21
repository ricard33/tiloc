import "typeface-roboto";
import React from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import * as serviceWorker from "./serviceWorker";
import App from "./App";
import { alert, auth as authActions } from "./actions";
import { Provider } from "react-redux";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import rootSaga from "./sagas";
import orm from "./orm";
import { createFullStore } from "./store";
import "./index.css";
import { createBrowserHistory } from "history";
import "quill";

const { sagaMiddleware, store } = createFullStore(orm);
const browserHistory = createBrowserHistory();

sagaMiddleware.run(rootSaga);


// Add a request interceptor
axios.interceptors.request.use(
  function(config) {
    // Do something before request is sent
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  }, function(error) {
    // Do something with request error
    return Promise.reject(error);
  });

// Response interceptor.
axios.interceptors.response.use(
  function(response) {
    // Do something with response data
    console.debug("set-cookie", response.headers["set-cookie"]);
    return response;
  },
  function(error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Code " + error.response.status, error.response.data);
      console.log(error.response.headers);
      if (error.response.data.detail)
        store.dispatch(alert.loadErrors(error.response.data.detail, error));
      else
        store.dispatch(alert.loadErrors("Server error", error));
      if (error.response.status === 401){
        const location = {...browserHistory.location};
        store.dispatch(authActions.tokenExpired())
        console.warn("Push to /login from", location);
        browserHistory.push("/login", {from: location});
      }

    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
      store.dispatch(alert.loadErrors("No response from server", error));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("Request error", error.message);
      store.dispatch(alert.loadErrors("Request error", error));
    }
    console.log(error.config);
    return Promise.reject(error);
  }
);

ReactDOM.render(
  <Provider store={store}>
    <I18nextProvider i18n={i18n}>
      <App history={browserHistory}/>
    </I18nextProvider>
  </Provider>,
  document.getElementById("root"));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
