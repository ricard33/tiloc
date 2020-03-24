import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { createStore } from 'redux';
// import './index.css';
import * as serviceWorker from './serviceWorker';
import App from './App';
import { loadErrors } from "./actions/alert";
import rootReducer from './reducers/index';
import { Provider } from "react-redux";

const store = createStore(rootReducer);

// Response interceptor.
axios.interceptors.response.use(
  function(response) {
    // Do something with response data
    return response;
  },
  function(error) {
    console.error("Network error: " + error);
    store.dispatch(loadErrors("Network error", error));
    return Promise.reject(error);
  }
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
