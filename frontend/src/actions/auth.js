import * as actionTypes from "./actionTypes";
import axios from "axios";

export const loadUser = () => {
  return (dispatch, getState) => {
    dispatch({type: actionTypes.USER_LOADING});

    const token = getState().auth.token;

    let headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Token ${token}`;
    }
    return fetch("/api/auth/user/", {headers, })
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          dispatch({type: actionTypes.USER_LOADED, user: res.data });
          return res.data;
        } else if (res.status >= 400 && res.status < 500) {
          dispatch({type: actionTypes.AUTHENTICATION_ERROR, data: res.data});
          throw res.data;
        }
      })
  }
};

export const login = (username, password) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    let body = JSON.stringify({username, password});

    return axios.post("/api/auth/login/", body, {headers})
      .then(res => {
        console.log("Login response: ", res);
        if (res.status === 200) {
          dispatch({type: actionTypes.LOGIN_SUCCESSFUL, data: res.data });
          return res.data;
        } else if (res.status === 403 || res.status === 401) {
          dispatch({type: actionTypes.AUTHENTICATION_ERROR, data: res.data});
          throw res.data;
        } else {
          dispatch({type: actionTypes.LOGIN_FAILED, data: res.data});
          throw res.data;
        }
      })
      .catch(reason => {
        console.error("LOGIN ERROR", reason);
      })
  }
};
