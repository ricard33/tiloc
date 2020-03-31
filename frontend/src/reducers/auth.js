import * as actionTypes from "../actions/actionTypes";

const initialState = {
  token: localStorage.getItem("token"),
  isAuthenticated: null,
  isLoading: false,
  user: null,
  errors: {},
};


export default function auth(state=initialState, action) {

  switch (action.type) {

    case actionTypes.USER_LOADING:
      return {...state, isLoading: true};

    case actionTypes.USER_LOADED:
      return {...state, isAuthenticated: true, isLoading: false, user: action.user};

    case actionTypes.LOGIN_SUCCESSFUL:
      // TODO Should use subscribe() or middleware instead of reducer
      localStorage.setItem("token", action.data.token);
      return {...state, ...action.data, isAuthenticated: true, isLoading: false, errors: null};

    case actionTypes.AUTHENTICATION_ERROR:
    case actionTypes.LOGIN_FAILED:
    case actionTypes.LOGOUT_SUCCESSFUL:
      localStorage.removeItem("token");
      return {...state, errors: action.data, token: null, user: null,
        isAuthenticated: false, isLoading: false};

    default:
      return state;
  }
}
