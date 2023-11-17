import React, { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import validate from "validate.js";
import "react-perfect-scrollbar/dist/css/styles.css";
import { useDispatch, useSelector } from "react-redux";
import { auth } from "./actions";
import "./assets/scss/index.scss";
import validators from "./common/validators";
import Routes from "./Routes";
import theme from "./theme";
import frLocale from "date-fns/locale/fr";
import Notifier from "./components/Notifier";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ConfirmProvider } from "./libs/MuiConfirm";
import { useCurrentUserQuery } from "./services/api";
import { RootState } from "./store";
import { DateProvider } from "@ti-gecko/react-calendar-timeline";
import { useAlert } from "./common/alertUtils";
import { differenceInCalendarDays, formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";

validate.validators = {
  ...validate.validators,
  ...validators
};

type Props = {
};

function App(props: Props) {
  const dispatch = useDispatch();
  const token = useSelector<RootState>((store) => store.auth.token);
  const { data: currentUser, error: userLoadingError, refetch: refetchUser } = useCurrentUserQuery();
  const { showInfo, showWarning } = useAlert();
  const { t } = useTranslation();

  useEffect(() => {
    // console.log("useEffect token", token);
    // dispatch(auth.userLoading());
    refetchUser();
  }, [dispatch, refetchUser, token]);

  useEffect(() => {
    // console.log("useEffect user", currentUser);
    if(currentUser) {
      dispatch(auth.userLoaded(currentUser));
      console.log(currentUser.account);
      console.log("End fo validity: ", currentUser.account.validity);
      console.log("End fo validity: ", formatDistanceToNow(currentUser.account.validity));
      const remainingDays = differenceInCalendarDays(currentUser.account.validity, new Date());
      if(remainingDays < 0) {
        showInfo(t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential."));
      }
      else if(remainingDays < 14) {
        console.log(`Your subscription will end in ${remainingDays} days.`);
        const showMessage = remainingDays < 5 ? showWarning : showInfo;
        showMessage(t("Your subscription will end in {{ count }} days.", {count: remainingDays}));
      }
    }
  }, [dispatch, currentUser, token, showInfo, t, showWarning]);

  useEffect(() => {
    if(userLoadingError)
      dispatch(auth.authenticationError(userLoadingError));
  }, [dispatch, userLoadingError]);

  return (
    // <StyledEngineProvider injectFirst>
    // </StyledEngineProvider>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
        <DateProvider locale={frLocale}>
          <ConfirmProvider>
            <Notifier />
            <BrowserRouter>
              <Routes />
            </BrowserRouter>
          </ConfirmProvider>
        </DateProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
