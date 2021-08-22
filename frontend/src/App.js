import React, { useEffect } from "react";
import { Router } from "react-router-dom";
import { ThemeProvider } from "@material-ui/styles";
import validate from "validate.js";
import "react-perfect-scrollbar/dist/css/styles.css";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import * as actions from "./actions";
import { auth } from "./actions";
import "./assets/scss/index.scss";
import AlertHandler from "./components/alertHandler";
import validators from "./common/validators";
import Routes from "./Routes";
import theme from "./theme";
import moment from "moment";
import { ConfirmProvider } from "material-ui-confirm";
import localization from "moment/locale/fr";
import DateFnsUtils from "@date-io/date-fns";
import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import frLocale from "date-fns/locale/fr";


validate.validators = {
  ...validate.validators,
  ...validators
};


function App(props) {
  const dispatch = useDispatch();
  const token = useSelector(store => store.auth.token);
  moment.updateLocale("fr", localization);
  moment.locale("fr");

  useEffect(() => {
    dispatch(auth.loadUser(token));
    dispatch(actions.fetchOwners());
    dispatch(actions.fetchBookings());
    dispatch(actions.fetchBookingStatuses());
    dispatch(actions.fetchBookingChannels());
    dispatch(actions.fetchLodgings());
    dispatch(actions.fetchServices());
  }, [dispatch, token]);

  return (
    <ThemeProvider theme={theme}>
      <MuiPickersUtilsProvider utils={DateFnsUtils} locale={frLocale}>
        <ConfirmProvider>
          <Router history={props.history}>

            <Routes />
          </Router>
          <AlertHandler />
        </ConfirmProvider>
      </MuiPickersUtilsProvider>
    </ThemeProvider>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired
};
export default App;
