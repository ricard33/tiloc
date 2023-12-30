import * as actionTypes from "../actions/actionTypes";
import { Account, User } from "../types";
import { AuthAction } from "../actions";

export interface AuthState {
  token?: string,
  isAuthenticated: boolean,
  isLoading: boolean,
  user?: User,
  account?: Account,
  errors?: {},
  needToReload: boolean,
}

const initialState: AuthState = {
  token: localStorage.getItem("token") ?? undefined,
  isAuthenticated: false,
  isLoading: true,
  user: undefined,
  account: undefined,
  errors: {},
  needToReload: true,
};


export default function auth(state = initialState, action: AuthAction): AuthState {

  switch (action.type) {

    case actionTypes.USER_LOADING:
      return { ...state, isLoading: true, needToReload: false };

    case actionTypes.USER_LOADED:
      return { ...state, isAuthenticated: true, isLoading: false, needToReload: false, user: action.user, account: action.account };

    case actionTypes.LOGIN_SUCCESSFUL:
      return {
        ...state, token: action.token, user: action.user, account: action.account,
        isAuthenticated: true, isLoading: false, errors: undefined
      };

    case actionTypes.AUTHENTICATION_ERROR:
    case actionTypes.LOGIN_FAILED:
    case actionTypes.LOGOUT_SUCCESSFUL:
    case actionTypes.AUTH_TOKEN_EXPIRED:
      return {
        ...state, errors: action.data, token: undefined, user: undefined,
        isAuthenticated: false, isLoading: false
      };

    case actionTypes.NEED_TO_RELOAD_USER:
      return { ...state, needToReload: true, };

    case actionTypes.SUBSCRIPTION_UPDATED:
      return {
        ...state, account: {
          ...state.account as Account,
          current_subscription: action.subscription!
        }
      };

    default:
      return state;
  }
}
