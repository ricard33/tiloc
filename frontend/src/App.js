import React, { useEffect } from "react";
import { Router } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import validate from "validate.js";
import "react-perfect-scrollbar/dist/css/styles.css";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
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

validate.validators = {
  ...validate.validators,
  ...validators
};


function App(props) {
  const dispatch = useDispatch();
  const token = useSelector(store => store.auth.token);
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
        <ConfirmProvider>
          <Notifier />
          <Router history={props.history}>

            <Routes />
          </Router>
        </ConfirmProvider>
      </LocalizationProvider>
    </ThemeProvider>
    // </StyledEngineProvider>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired
};
export default App;
