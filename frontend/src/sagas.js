import { all, apply, call, put, takeEvery } from "redux-saga/effects";
import * as types from "./actions/actionTypes";
import * as actionTypes from "./actions/actionTypes";
import axios from "axios";
import { template } from "./common/stringUtils";
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
  const { username, password, callback } = action;

  try {
    const res = yield call(loginFromApi, username, password);
    yield put({ type: actionTypes.LOGIN_SUCCESSFUL, data: res.data });
    yield call(callback);
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
  const { callback } = action;

  const res = yield call(axios.post, "/api/auth/logout/");

  try {
    yield put({ type: actionTypes.LOGOUT_SUCCESSFUL });
    if(callback)
      yield call(callback);
  } catch (reason) {
    console.error("LOGOUT ERROR", reason);
    logger.error(reason)
  }
}


function* _fetchData(path, action) {
  if(!action.type.endsWith("_REQUEST"))
    throw new Error("fetchData: Action types have to finish by '_REQUEST' string");
  const actionBaseName = action.type.slice(0, -8);
  try {
    const offset = 0, limit = null; // not yet used
    let filter = action.filter ? "?" + action.filter : "";
    const response = yield call(axios.get, path + filter);
    yield put({
      type: types.SUCCESS(actionBaseName),
      data: response.data,
      query: {offset, limit}
    });
  } catch (error) {
    console.error(types.FAILURE(actionBaseName), error);
    logger.error(error, {action})
    yield put({
      type: types.FAILURE(actionBaseName),
      error
    });
  }
}

function* _createData(path, action) {
  if(!action.type.endsWith("_REQUEST"))
    throw new Error("createData: Action types have to finish by '_REQUEST' string");
  const actionBaseName = action.type.slice(0, -8);
  try {
    const response = yield call(axios.post, template(path, action.urlParams), action.data);
    yield put({
      type: types.SUCCESS(actionBaseName),
      data: response.data,
    });
    if(action.callback) {
      yield call(action.callback, response.data);
    }
  } catch (error) {
    console.error(types.FAILURE(actionBaseName), error);
    logger.error(error, {action})
    yield put({
      type: types.FAILURE(actionBaseName),
      error
    });
  }
}

function* _updateData(path, action) {
  if(!action.type.endsWith("_REQUEST"))
    throw new Error("updateData: Action types have to finish by '_REQUEST' string");
  const actionBaseName = action.type.slice(0, -8);
  try {
    const response = yield call(axios.patch, path + action.id + "/", action.data);
    yield put({
      type: types.SUCCESS(actionBaseName),
      data: response.data,
    });
    if(action.callback) {
      yield call(action.callback, response.data);
    }
  } catch (error) {
    console.error(types.FAILURE(actionBaseName), error);
    logger.error(error, {action})
    yield put({
      type: types.FAILURE(actionBaseName),
      error
    });
  }
}

function* _deleteData(path, action) {
  if(!action.type.endsWith("_REQUEST"))
    throw new Error("deleteData: Action types have to finish by '_REQUEST' string");
  const actionBaseName = action.type.slice(0, -8);
  try {
    const response = yield call(axios.delete, path + action.id + "/");
    yield put({
      type: types.SUCCESS(actionBaseName),
      id: action.id,
    });
    if(action.callback) {
      yield call(action.callback, response.data);
    }
  } catch (error) {
    console.error(types.FAILURE(actionBaseName), error);
    logger.error(error, {action})
    yield put({
      type: types.FAILURE(actionBaseName),
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
    yield takeEvery(actionTypes.LOGOUT_REQUEST, logout),
    yield takeEvery(actionTypes.REQUEST(actionTypes.FETCH_BOOKINGS), _fetchData, "/api/booking/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.CREATE_BOOKING), _createData, "/api/booking/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.UPDATE_BOOKING), _updateData, "/api/booking/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.DELETE_BOOKING), _deleteData, "/api/booking/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.FETCH_BOOKING_STATUSES), _fetchData, "/api/booking_status/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.FETCH_BOOKING_CHANNELS), _fetchData, "/api/booking_channel/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.FETCH_LODGINGS), _fetchData, "/api/lodging/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.FETCH_OWNERS), _fetchData, "/api/owner/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.FETCH_CONTRACTS), _fetchData, "/api/contract/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.GET_OR_CREATE_CONTRACT), _createData, "/api/booking/${bookingId}/get_or_create_contract/"), // eslint-disable-line no-template-curly-in-string
    yield takeEvery(actionTypes.REQUEST(actionTypes.GENERATE_CONTRACT), _createData, "/api/booking/${bookingId}/generate_contract/"),// eslint-disable-line no-template-curly-in-string
    yield takeEvery(actionTypes.REQUEST(actionTypes.UPDATE_CONTRACT), _updateData, "/api/contract/"),
    yield takeEvery(actionTypes.REQUEST(actionTypes.DELETE_CONTRACT), _deleteData, "/api/contract/"),
  ]);
}
