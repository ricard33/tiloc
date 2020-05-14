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


validate.validators = {
  ...validate.validators,
  ...validators
};

function App(props) {
  const dispatch = useDispatch();
  const token = useSelector(store => store.auth.token);

  useEffect(() => {
    dispatch(auth.loadUser(token));
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
