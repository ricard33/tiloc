import React, { useEffect } from "react";
import { Router } from "react-router-dom";
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
import { LocalizationProvider } from "@mui/lab";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import { ConfirmProvider } from "./libs/MuiConfirm";
import { useCurrentUserQuery } from "./services/api";
import { History } from "history";
import { RootState } from "./store";
import { DateProvider } from "@gecko-conception/react-calendar-timeline";

validate.validators = {
  ...validate.validators,
  ...validators
};

type Props = {
  history: History<unknown>
};

function App(props: Props) {
  const dispatch = useDispatch();
  const token = useSelector<RootState>((store) => store.auth.token);
  const { data: currentUser, error: userLoadingError, refetch: refetchUser } = useCurrentUserQuery();

  useEffect(() => {
    console.log("useEffect token", token);
    dispatch(auth.userLoading());
    refetchUser();
  }, [dispatch, refetchUser, token]);

  useEffect(() => {
    console.log("useEffect user", currentUser);
    if(currentUser)
      dispatch(auth.userLoaded(currentUser));
  }, [dispatch, currentUser, token]);

  useEffect(() => {
    if(userLoadingError)
      dispatch(auth.authenticationError(userLoadingError));
  }, [dispatch, userLoadingError]);

  return (
    // <StyledEngineProvider injectFirst>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} locale={frLocale}>
        <DateProvider locale={frLocale}>
          <ConfirmProvider>
            <Notifier />
            <Router history={props.history}>

              <Routes />
            </Router>
          </ConfirmProvider>
        </DateProvider>
      </LocalizationProvider>
    </ThemeProvider>
    // </StyledEngineProvider>
  );
}

export default App;
