import React from "react";
import { Link as RouterLink } from "react-router-dom";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import { AppBar, AppBarProps, Theme, Toolbar } from "@mui/material";
import LogoTiloc from "../../../../assets/images/logos/logo-tiloc-with-name.png";

const useStyles = makeStyles((theme: Theme) => ({
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

export interface TopbarProps extends AppBarProps {
  className?: string;
}

const Topbar: React.FC<TopbarProps> = (props) => {
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
            src={LogoTiloc}
            width="110"
          />
          {/*<span className={classes.appName}>Tiloc</span>*/}
        </RouterLink>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
