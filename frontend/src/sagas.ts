import { all, takeEvery } from "redux-saga/effects";
import * as actionTypes from "./actions/actionTypes";

// const delay = (ms) => new Promise(res => setTimeout(res, ms));

function setAuthToken(action: {type: string, data:{token: string}}) {
  localStorage.setItem("token", action.data.token);
}

function deleteToken() {
  localStorage.removeItem("token");
}

// notice how we now only export the rootSaga
// single entry point to start all Sagas at once
export default function* rootSaga() {
  yield all([
    takeEvery(actionTypes.LOGIN_SUCCESSFUL, setAuthToken),
    takeEvery([
      actionTypes.AUTHENTICATION_ERROR,
      actionTypes.LOGIN_FAILED,
      actionTypes.LOGOUT_SUCCESSFUL,
      actionTypes.AUTH_TOKEN_EXPIRED], deleteToken),
  ]);
}
