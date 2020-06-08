import React, { useEffect } from "react";
import { Router } from "react-router-dom";
import { ThemeProvider } from "@material-ui/styles";
import validate from "validate.js";
import "react-perfect-scrollbar/dist/css/styles.css";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { auth } from "./actions";
import "./assets/scss/index.scss";
import AlertHandler from "./components/alertHandler";
import validators from "./common/validators";
import Routes from "./Routes";
import theme from "./theme";
import moment from "moment";
// import 'moment/min/moment-with-locales';
import localization from 'moment/locale/fr';
import * as actions from "./actions";


validate.validators = {
  ...validate.validators,
  ...validators
};

function App(props) {
  const dispatch = useDispatch();
  const token = useSelector(store => store.auth.token);
  moment.updateLocale('fr', localization);
  moment.locale('fr');

  useEffect(() => {
    dispatch(auth.loadUser(token));
    dispatch(actions.fetchOwners());
  }, [dispatch, token]);

  return (
    <ThemeProvider theme={theme}>
      <Router history={props.history}>
        <Routes/>
      </Router>
      <AlertHandler />
    </ThemeProvider>
  );
}

App.propTypes = {
  history: PropTypes.object.isRequired
};
export default App;
