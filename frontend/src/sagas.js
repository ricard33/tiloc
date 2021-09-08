import { all, apply, call, put, takeEvery } from "redux-saga/effects";
import * as actionTypes from "./actions/actionTypes";
import axios from "axios";
import logger from './common/logger';

// const delay = (ms) => new Promise(res => setTimeout(res, ms));

function* loadUser(action) {
  const token = action.token;

  let headers = {
    "Content-Type": "application/json"
  };

  if (token) {
    headers["Authorization"] = `Token ${token}`;
  }
  const res = yield call(fetch, "/api/auth/user/", { headers });
  if (res.status < 500) {
    const data = yield apply(res, "json");
    if (res.status === 200) {
      yield put({ type: actionTypes.USER_LOADED, user: data });
    } else if (res.status >= 400 && res.status < 500) {
      yield put({ type: actionTypes.AUTHENTICATION_ERROR, data: res.data });
    }
  } else {
    logger.warn(res);
    console.error("Server Error!");
    throw res;
  }
}

function loginFromApi(username, password) {
  let headers = { "Content-Type": "application/json" };
  let body = JSON.stringify({ username, password });
  return axios.post("/api/auth/login/", body, { headers });
}

function* login(action) {
  const { username, password } = action;

  try {
    const res = yield call(loginFromApi, username, password);
    localStorage.setItem("token", res.data.token);
    yield put({ type: actionTypes.LOGIN_SUCCESSFUL, data: res.data });
  } catch (reason) {
    console.error("LOGIN ERROR", reason);
    logger.error(reason)
    const res = reason.response;
    if (res  && (res.status === 403 || res.status === 401)) {
      yield put({ type: actionTypes.AUTHENTICATION_ERROR, data: res.data });
    } else {
      const data = res ? res.data : reason.message;
      yield put({ type: actionTypes.LOGIN_FAILED, data: data});
    }
  }
}

function* logout(action) {
  yield call(axios.post, "/api/auth/logout/");

  try {
    yield put({ type: actionTypes.LOGOUT_SUCCESSFUL });
  } catch (reason) {
    console.error("LOGOUT ERROR", reason);
    logger.error(reason)
  }
}

function deleteToken(action) {
  localStorage.removeItem("token");
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  yield all([
    yield takeEvery(actionTypes.USER_LOADING, loadUser),
    yield takeEvery(actionTypes.LOGIN_REQUEST, login),
    yield takeEvery(actionTypes.LOGOUT_REQUEST, logout),
    yield takeEvery([
      actionTypes.AUTHENTICATION_ERROR,
      actionTypes.LOGIN_FAILED,
      actionTypes.LOGOUT_SUCCESSFUL,
      actionTypes.AUTH_TOKEN_EXPIRED], deleteToken),
  ]);
}
