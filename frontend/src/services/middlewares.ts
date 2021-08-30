import {
  MiddlewareAPI,
  isRejectedWithValue,
  Middleware,
} from '@reduxjs/toolkit'
import { dispatchError } from "../common/alertUtils";
import { apiErrorDecode } from "../common/apiUtils";

/**
 * Log a warning and show a toast!
 */
export const rtkQueryErrorLogger: Middleware =
  (api: MiddlewareAPI) => (next) => (action) => {
    // RTK Query uses `createAsyncThunk` from redux-toolkit under the hood, so we're able to utilize these use matchers!
    if (isRejectedWithValue(action)) {
      console.warn('We got a rejected action!', action)
      if(action.payload && action.payload.data) {
        dispatchError("SERVER ERROR: " + apiErrorDecode(action.payload.data));
      } else if (action.error) {
        if( action.error.message)
          dispatchError('Async error! ' + action.error.message);
        else
          dispatchError('Async error! ' + JSON.stringify(action.error));
      } else
        dispatchError('Async error!');
    }

    return next(action)
  }
