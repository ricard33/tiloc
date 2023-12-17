import React, { useEffect } from "react";
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
import { DateProvider } from "@ti-gecko/react-calendar-timeline";
import { useAlert } from "./common/alertUtils";
import { differenceInCalendarDays, formatDistanceToNow, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatDate, isValidDate } from "./common/dateUtils";
import axios from "axios";
import { useAppSelector } from "./app/hooks";
import ChatwootWidget from "./components/ChatwootWidget";

validate.validators = {
  ...validate.validators,
  ...validators
};

type Props = {};

function App(props: Props) {
  const dispatch = useDispatch();
  const token = useAppSelector((store) => store.auth.token);
  const isNeedToReloadUser = useAppSelector((store) => store.auth.needToReload);
  const isAppInfoLoaded = useAppSelector((store) => store.appInfo.loaded);
  const { data: currentUser, error: userLoadingError, refetch: refetchUser } = useCurrentUserQuery();
  const { showInfo, showWarning } = useAlert();
  const { t } = useTranslation();

  useEffect(() => {
    refetchUser();
  }, [refetchUser, token]);

  useEffect(() => {
    if (isNeedToReloadUser)
      refetchUser();
  }, [refetchUser, isNeedToReloadUser]);

  useEffect(() => {
    if (!isAppInfoLoaded)
      axios.get("/api/info/")
        .then(response => {
          // console.debug(response);
          dispatch(appInfoLoaded({
            loaded: true,
            version: response.data.version,
            buildDate: formatDate(parseISO(response.data.build_date)),
            canRegister: response.data.can_register
          }));
        })
        .catch(() => {
        });
  }, [dispatch, isAppInfoLoaded]);

  useEffect(() => {
    // console.log("useEffect user", currentUser);
    if (currentUser) {
      dispatch(auth.userLoaded(currentUser));
      // console.log(currentUser.account);
      // console.log("End fo validity: ", currentUser.account.validity);
      if (currentUser.account.trial_is_over) {
        showInfo(t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential."));
      } else if (currentUser.account.current_subscription.status !== "active") {
        if (isValidDate(currentUser.account.validity)) {
          console.log("End fo validity: ", formatDistanceToNow(currentUser.account.validity));
        }
        const remainingDays = isValidDate(currentUser.account.validity) ?
          differenceInCalendarDays(currentUser.account.validity, new Date()) : -1;
        if (currentUser.account.trial_is_over) {
          showInfo(t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential."));
        } else if (remainingDays < 14) {
          console.log(`Your subscription will end in ${remainingDays} days.`);
          const showMessage = remainingDays < 5 ? showWarning : showInfo;
          showMessage(t("Your subscription will end in {{ count }} days.", { count: remainingDays }));
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
          <ConfirmProvider>
            <Notifier />
            <ChatwootWidget token={"UE45iXRLSEwoFyg8AkNgvivH"}/>
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
