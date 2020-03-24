import * as types from '../actions/actionTypes';

const initialState = {};

export default (state = initialState, action) => {
  if (action.type === types.SHOW_ALERT) {
    return {
      ...state,
      'severity': action.severity,
      'message': action.message,
      // 'error': action.error
    };
  }

  if (action.type === types.CLEAR_ALERT) {
    return initialState;
  }

  return state;
};
