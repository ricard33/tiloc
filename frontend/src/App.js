import React, { useEffect } from "react";
import { Router } from "react-router-dom";
import { createBrowserHistory } from "history";
import { ThemeProvider } from "@material-ui/styles";
import validate from "validate.js";
import theme from "./theme";
import "react-perfect-scrollbar/dist/css/styles.css";
import "./assets/scss/index.scss";
import validators from "./common/validators";
import Routes from "./Routes";
import AlertHandler from "./components/alertHandler";
import { useDispatch } from "react-redux";
import { auth } from "./actions";
// import 'typeface-roboto';

const browserHistory = createBrowserHistory();

validate.validators = {
  ...validate.validators,
  ...validators
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(auth.loadUser());
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <Router history={browserHistory}>
        <Routes/>
      </Router>
      <AlertHandler />
    </ThemeProvider>
  );
}

export default App;
