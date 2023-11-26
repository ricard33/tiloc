import * as actionTypes from "../actions/actionTypes";
import { Account, User } from "../types";
import { AuthAction } from "../actions";

export interface AuthState {
  token?: string,
  isAuthenticated: boolean,
  isLoading: boolean,
  user?: User,
  errors?: {}
}

const initialState: AuthState = {
  token: localStorage.getItem("token") ?? undefined,
  isAuthenticated: false,
  isLoading: true,
  user: undefined,
  errors: {}
};


export default function auth(state = initialState, action: AuthAction): AuthState {

  switch (action.type) {

    case actionTypes.USER_LOADING:
      return { ...state, isLoading: true };

    case actionTypes.USER_LOADED:
      return { ...state, isAuthenticated: true, isLoading: false, user: action.user };

    case actionTypes.LOGIN_SUCCESSFUL:
      return { ...state, ...action.data, isAuthenticated: true, isLoading: false, errors: undefined };

    case actionTypes.AUTHENTICATION_ERROR:
    case actionTypes.LOGIN_FAILED:
    case actionTypes.LOGOUT_SUCCESSFUL:
    case actionTypes.AUTH_TOKEN_EXPIRED:
      return {
        ...state, errors: action.data, token: undefined, user: undefined,
        isAuthenticated: false, isLoading: false
      };

    case actionTypes.SUBSCRIPTION_UPDATED:
      return {
        ...state, user: {
          ...state.user as User, account: {
            ...state.user!.account as Account,
            current_subscription: action.subscription!,
          }
        }
      };

    default:
      return state;
  }
}
