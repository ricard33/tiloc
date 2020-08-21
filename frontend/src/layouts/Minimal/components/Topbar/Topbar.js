import React from "react";
import { Link as RouterLink } from "react-router-dom";
import clsx from "clsx";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import { AppBar, Toolbar } from "@material-ui/core";
import LogoTiLoc from "../../../../assets/images/logos/logo-tiloc.png";

const useStyles = makeStyles(() => ({
  root: {
    boxShadow: 'none'
  },
  appLogo: {
    verticalAlign: "text-bottom"
  },
  appName: {
    color: "white",
    fontSize: "2em"
  },
}));

const Topbar = props => {
  const { className, ...rest } = props;

  const classes = useStyles();

  return (
    <AppBar
      {...rest}
      className={clsx(classes.root, className)}
      color="primary"
      position="fixed"
    >
      <Toolbar>
        <RouterLink to="/">
          <img
            className={classes.appLogo}
            alt="Logo"
            src={LogoTiLoc}
            width="32"
          />
          <span className={classes.appName}>Ti Loc</span>
        </RouterLink>
      </Toolbar>
    </AppBar>
  );
};

Topbar.propTypes = {
  className: PropTypes.string
};

export default Topbar;
