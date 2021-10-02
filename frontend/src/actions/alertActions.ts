import { OptionsObject, SnackbarKey } from "notistack";

export const ENQUEUE_SNACKBAR = "ENQUEUE_SNACKBAR";
export const CLOSE_SNACKBAR = "CLOSE_SNACKBAR";
export const REMOVE_SNACKBAR = "REMOVE_SNACKBAR";

interface Notification {
  message: string,
  options?: OptionsObject,
}

export interface NotificationAction {
  key: SnackbarKey,
  message: string,
  options?: OptionsObject,
  dismissed?: boolean,
}

export interface AlertAction {
  type: string,
  key?: SnackbarKey,
  notification?: NotificationAction,
  dismissAll?: boolean,
}

export const enqueueAlert = (notification: Notification): AlertAction => {
  const key = notification.options && notification.options.key;

  return {
    type: ENQUEUE_SNACKBAR,
    notification: {
      ...notification,
      key: key || new Date().getTime() + Math.random(),
    },
  };
};

export const closeAlert = (key: SnackbarKey): AlertAction => ({
  type: CLOSE_SNACKBAR,
  dismissAll: !key, // dismiss all if no key has been defined
  key
});

export const removeAlert = (key: SnackbarKey): AlertAction => ({
  type: REMOVE_SNACKBAR,
  key
});
