import React from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { createStore, applyMiddleware } from 'redux';
// import './index.css';
import * as serviceWorker from './serviceWorker';
import App from './App';
import { alert } from "./actions";
import rootReducer from './reducers/index';
import { Provider } from "react-redux";
import thunk from "redux-thunk";

const store = createStore(rootReducer, applyMiddleware(thunk));

// Response interceptor.
axios.interceptors.response.use(
  function(response) {
    // Do something with response data
    return response;
  },
  function(error) {
    console.error("Network error: " + error);
    store.dispatch(alert.loadErrors("Network error", error));
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
