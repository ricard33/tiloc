import React from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import { AppBar, AppBarProps, IconButton, Theme, Toolbar, Tooltip } from "@mui/material";
import LogoTiloc from "../../../../assets/images/logos/logo-tiloc-with-name.png";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { fetchErrorDecode } from "../../../../common/apiUtils";
import logger from "../../../../common/logger";
import { auth } from "../../../../actions";
import { useLogoutMutation } from "../../../../services/api";
import { useTranslation } from "react-i18next";
import { useAlert } from "../../../../common/alertUtils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../store";
import { User } from "../../../../types";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    boxShadow: "none"
  },
  appLogo: {
    verticalAlign: "text-bottom"
  },
  appName: {
    color: "white",
    fontSize: "2em"
  }
}));

export interface TopbarProps extends AppBarProps {
  className?: string;
}

const Topbar: React.FC<TopbarProps> = (props) => {
  const { className, ...rest } = props;
  const [doLogout] = useLogoutMutation();
  const { t } = useTranslation();
  const { showError } = useAlert();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;

  const classes = useStyles();

  const handleSignOut: React.MouseEventHandler = event => {
    event.preventDefault();
    doLogout().then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        showError(t("Logout error: ") + fetchErrorDecode(error));
        console.error(result);
        logger.error(result);
      } else {
        dispatch(auth.logoutSuccessful());
        console.log("Logged out!");
        navigate("/logged-out");
      }
    });
  };


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
        <div style={{ flexGrow: 1 }} />
        {user && <Tooltip title={t("Logout from application")}>
          <IconButton color="inherit" size="large" onClick={handleSignOut}>
            <ExitToAppIcon />
          </IconButton>
        </Tooltip>}
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
