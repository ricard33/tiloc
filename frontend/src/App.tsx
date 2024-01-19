import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import validate from "validate.js";
import "react-perfect-scrollbar/dist/css/styles.css";
import { useDispatch } from "react-redux";
import { appInfoLoaded, auth } from "./actions";
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
// @ts-ignore
import { DateProvider } from "@ti-gecko/react-calendar-timeline";
import { useAlert } from "./common/alertUtils";
import { differenceInCalendarDays, formatDistanceToNow, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatDate, isValidDate } from "./common/dateUtils";
import axios from "axios";
import { useAppSelector } from "./app/hooks";
import LoadingInProgress from "./components/LoadingInProgress";
import useInterval from "./common/useInterval";
import { AppInfo } from "./types";

validate.validators = {
  ...validate.validators,
  ...validators
};

type Props = {};

function App(props: Props) {
  const dispatch = useDispatch();
  const token = useAppSelector((store) => store.auth.token);
  const appInfo = useAppSelector(store => store.appInfo) as AppInfo;
  const isNeedToReloadUser = useAppSelector((store) => store.auth.needToReload);
  const { data: currentUser, error: userLoadingError, refetch: refetchUser } = useCurrentUserQuery();
  const { showInfo, showWarning, showError } = useAlert();
  const { t } = useTranslation();
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    refetchUser();
  }, [refetchUser, token]);

  useEffect(() => {
    if (isNeedToReloadUser)
      refetchUser();
  }, [refetchUser, isNeedToReloadUser]);

  const loadAppInfo = useCallback(() => {
    // console.log("Request info");
    axios.get("/api/info/")
      .then(response => {
        // console.debug(response);
        dispatch(appInfoLoaded({
          loaded: true,
          version: response.data.version,
          frontendVersion: appInfo.loaded ? appInfo.frontendVersion : response.data.version,
          buildDate: formatDate(parseISO(response.data.build_date)),
          canRegister: response.data.can_register,
          useInAppChat: response.data.use_inapp_chat,
          isDemo: response.data.is_demo
        }));
      })
      .catch(() => {
        showError(t("Server error. Can't load application information."));
      });
  }, [appInfo.frontendVersion, appInfo.loaded, dispatch, showError, t]);

  useInterval(loadAppInfo, 60*1000);

  useEffect(() => {
    if (!initialised) {
      setInitialised(true);
      loadAppInfo();
    }
  }, [initialised, loadAppInfo]);

  useEffect(() => {
    // console.log("useEffect user", currentUser);
    if (currentUser) {
      dispatch(auth.userLoaded(currentUser));
      const account = currentUser.account;
      // console.log(account);
      // console.log("End fo validity: ", account.validity);
      if (account.is_free_plan) {
        // showInfo(t("You're on free plan. Upgrade your subscription to unleash Tiloc’s the full potential."));
      } else if (account.current_subscription.status === "trialing") {
        if (isValidDate(account.validity)) {
          console.log("End fo validity: ", formatDistanceToNow(account.validity));
        }
        const remainingDays = isValidDate(account.validity) ?
          differenceInCalendarDays(account.validity, new Date()) : -1;
        if (account.trial_is_over) {
          showInfo(t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential."));
        } else if (remainingDays < 14) {
          console.log(`Your trial period will end in ${remainingDays} days.`);
          const showMessage = remainingDays < 5 ? showWarning : showInfo;
          showMessage(t("Your trial period will end in {{ count }} days.", { count: remainingDays }));
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (userLoadingError)
      dispatch(auth.authenticationError(userLoadingError));
  }, [dispatch, userLoadingError]);

  return (
    // <StyledEngineProvider injectFirst>
    // </StyledEngineProvider>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={frLocale}>
        <DateProvider locale={frLocale}>
          {appInfo.loaded ?
            <ConfirmProvider>
              <Notifier />
              {/*<ChatwootWidget token={"F9GGzGyKirYZ5uipLprdTxU2"} showBubble />*/}
              <BrowserRouter>
                <Routes />
              </BrowserRouter>
            </ConfirmProvider>
            :
            <LoadingInProgress />
          }
        </DateProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
