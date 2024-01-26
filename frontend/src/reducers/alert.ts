import { ENQUEUE_SNACKBAR, CLOSE_SNACKBAR, REMOVE_SNACKBAR, AlertAction } from "../actions";
import { OptionsObject, SnackbarKey } from "notistack";

export interface Notification {
  key: SnackbarKey,
  message: string,
  options?: OptionsObject,
  dismissed?: boolean,
}

export interface AlertState {
  notifications: (Notification & {key: SnackbarKey})[]
}

const defaultState: AlertState = {
  notifications: []
};

export default function alertReducer(state = defaultState, action: AlertAction): AlertState {
  switch (action.type) {
    case ENQUEUE_SNACKBAR:
      if (!action.payload.notification)
        return state;
      return {
        ...state,
        notifications: [
          ...state.notifications,
          action.payload.notification
        ]
      };

    case CLOSE_SNACKBAR:
      return {
        ...state,
        notifications: state.notifications.map(notification => (
          (action.payload.dismissAll || notification.key === action.payload.key)
            ? { ...notification, dismissed: true }
            : { ...notification }
        ))
      };

    case REMOVE_SNACKBAR:
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.key !== action.payload.key
        )
      };

    default:
      return state;
  }
};
