import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";
import { AppBar, Avatar, Badge, Hidden, IconButton, Toolbar } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/NotificationsOutlined";
import InputIcon from "@mui/icons-material/Input";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import LogoTiLoc from "../../../../assets/images/logos/logo-tiloc.png";
import { useDispatch, useSelector } from "react-redux";
import { getGravatarUrl } from "../../../../components/Gravatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useTranslation } from "react-i18next";
import { auth } from "../../../../actions";
import { useLogoutMutation } from "../../../../services/api";
import { fetchErrorDecode } from "../../../../common/apiUtils";
import { useAlert } from "../../../../common/alertUtils";
import logger from "../../../../common/logger";

const useStyles = makeStyles(theme => ({
  root: {
    boxShadow: "none"
  },
  flexGrow: {
    flexGrow: 1
  },
  signOutButton: {
    marginLeft: theme.spacing(1)
  },
  appMenu: {
    color: "white",
    marginRight: "20px"
  },
  appLogo: {
    verticalAlign: "text-bottom"
  },
  appName: {
    color: "white",
    fontSize: "2em"
  }
}));

const Topbar = props => {
  const { className, onSidebarOpen, ...rest } = props;

  const classes = useStyles();

  const { t } = useTranslation();
  const [notifications] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const user = useSelector(store => store.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [doLogout, ] = useLogoutMutation();
  const { showError } = useAlert();

  const avatar = getGravatarUrl(user.email, {
    default: "mp"
  });

  const handleClickUser = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  const handleSignOut = event => {
    event.preventDefault();
    doLogout().then((result)=> {
      const {error} = result;
      if(error) {
        showError(t("Logout error: ") + fetchErrorDecode(error));
        console.error(result);
        logger.error(result)
      }
      else {
        dispatch(auth.logoutSuccessful());
        console.log("Logged out!")
        navigate("/logged-out");
      }
    })
  };

  return (
    <AppBar
      {...rest}
      className={clsx(classes.root, className)}
    >
      <Toolbar>
        <Hidden mdUp>
          <IconButton
            className={classes.appMenu}
            onClick={onSidebarOpen}
            size="large"
          >
            <MenuIcon />
          </IconButton>
        </Hidden>
        <RouterLink to="/">
          <img
            className={classes.appLogo}
            alt="Logo"
            src={LogoTiLoc}
            width="32"
          />
          <span className={classes.appName}>Ti Loc</span>
        </RouterLink>
        <div className={classes.flexGrow} />
        <IconButton color="inherit" size="large">
          <Badge
            badgeContent={notifications.length}
            color="primary"
            variant="dot"
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>
        <Avatar
          alt="Person"
          className={classes.avatar}
          component={IconButton}
          src={avatar}
          aria-controls="user-menu"
          aria-haspopup="true"
          onClick={handleClickUser}
        />
        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          elevation={0}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "center"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "center"
          }}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleCloseUserMenu}
        >
          <MenuItem>
            <ListItemIcon>
              <AccountBoxIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("My account")} />
          </MenuItem>
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <InputIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t("Logout")} />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

Topbar.propTypes = {
  className: PropTypes.string,
  onSidebarOpen: PropTypes.func
};

export default Topbar;
