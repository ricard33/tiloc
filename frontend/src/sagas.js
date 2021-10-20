import { all, takeEvery } from "redux-saga/effects";
import * as actionTypes from "./actions/actionTypes";

// const delay = (ms) => new Promise(res => setTimeout(res, ms));

function setAuthToken(action) {
  localStorage.setItem("token", action.data.token);
}

function deleteToken(action) {
  localStorage.removeItem("token");
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  yield all([
    yield takeEvery(actionTypes.LOGIN_SUCCESSFUL, setAuthToken),
    yield takeEvery([
      actionTypes.AUTHENTICATION_ERROR,
      actionTypes.LOGIN_FAILED,
      actionTypes.LOGOUT_SUCCESSFUL,
      actionTypes.AUTH_TOKEN_EXPIRED], deleteToken),
  ]);
}
