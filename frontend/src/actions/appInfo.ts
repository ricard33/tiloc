import * as actionTypes from "./actionTypes";
import { AppInfo } from "../types";

export interface AppInfoAction {
  type: string,
  appInfo: AppInfo,
}


export function appInfoLoaded(appInfo: AppInfo) {
  return {
    type: actionTypes.APP_INFO_LOADED,
    appInfo
  };
}
