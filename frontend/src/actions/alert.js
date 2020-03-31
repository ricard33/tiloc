import * as types from './actionTypes';

export const loadErrors = ( message, error) => ({
  type: types.SHOW_ALERT,
  severity: "error",
  message: message,
  error: error
});

export const loadWarnings = ( message, error) => ({
  type: types.SHOW_ALERT,
  severity: "warning",
  message: message,
  error: error
});

export const clearAlert = () => ({
  type: types.CLEAR_ALERT
});
