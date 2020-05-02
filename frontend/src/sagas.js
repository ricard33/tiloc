import { put, takeEvery, all, call, apply } from "redux-saga/effects";
import * as types from "./actions/actionTypes";
import axios from "axios";
import * as actionTypes from "./actions/actionTypes";

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

  const res = yield call(loginFromApi, username, password);

  try {
    if (res.status === 200) {
      yield put({ type: actionTypes.LOGIN_SUCCESSFUL, data: res.data });
    } else if (res.status === 403 || res.status === 401) {
      yield put({ type: actionTypes.AUTHENTICATION_ERROR, data: res.data });
      throw res.data;
    } else {
      yield put({ type: actionTypes.LOGIN_FAILED, data: res.data });
      throw res.data;
    }
  } catch (reason) {
    console.error("LOGIN ERROR", reason);
  }
}


function* _fetchData(path, action) {
  if(!action.type.endsWith("_REQUEST"))
    throw new Error("fetchData: Action types have to finish by '_REQUEST' string");
  const actionBaseName = action.type.slice(0, -8);
  try {
    const offset = 0, limit = null; // not yet used
    const response = yield call(axios.get, path);
    yield put({
      type: types[actionBaseName + "_SUCCESS"],
      data: response.data,
      query: {offset, limit}
    });
  } catch (error) {
    yield put({
      type: types[actionBaseName + "_FAILURE"],
      error
    });
  }
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  yield all([
    yield takeEvery(actionTypes.USER_LOADING, loadUser),
    yield takeEvery(actionTypes.LOGIN_REQUEST, login),
    yield takeEvery(actionTypes.FETCH_BOOKINGS_REQUEST, _fetchData, "/api/booking/"),
    yield takeEvery(actionTypes.FETCH_BOOKING_STATUSES_REQUEST, _fetchData, "/api/booking_status/"),
    yield takeEvery(actionTypes.FETCH_LODGINGS_REQUEST, _fetchData, "/api/lodging/"),
    yield takeEvery(actionTypes.FETCH_OWNERS_REQUEST, _fetchData, "/api/owner/"),
  ]);
}
