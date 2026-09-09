import { store } from "../store";
import { alert } from "../actions";
import React from "react";
import { useSnackbar, VariantType } from "notistack";
import { Button } from "@mui/material";
import { useTranslation } from "react-i18next";

export function dispatchError(message: string ) {
  store.dispatch(alert.enqueueAlert({message, options: {variant: 'error'}}));
}

export const useAlert = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { t } = useTranslation();

  const makeAlert = (variant: VariantType) => {
    return (message: string) => {
      const msg = message.length > 1000 ? (message.substring(0, 1000) + "...") : message;
      return enqueueSnackbar(msg, {
        variant: variant,
         
        action: (key) => (
          <Button onClick={() => closeSnackbar(key)}>{t("dismiss")}</Button>
        )
      });
    }
  };

  return {
    showError: makeAlert('error'),
    showWarning: makeAlert('warning'),
    showInfo: makeAlert('info'),
    showSuccess: makeAlert('success'),
    showDefault: makeAlert('default'),
  }
};
