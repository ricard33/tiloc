import * as actionTypes from "../actions/actionTypes";
import { AppInfo } from "../types";
import { AppInfoAction } from "../actions";

const initialState: AppInfo = {
  loaded: false,
  version: "?",
  frontendVersion: "?",
  buildDate: "-",
  canRegister: false,
  useInAppChat: false,
  isDemo: false,
};


export default function auth(state = initialState, action: AppInfoAction): AppInfo {

  switch (action.type) {

    case actionTypes.APP_INFO_LOADED:
      return { ...state, ...action.appInfo };

    default:
      return state;
  }
}
