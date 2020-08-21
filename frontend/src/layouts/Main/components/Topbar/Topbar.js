import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import clsx from "clsx";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import { AppBar, Avatar, Badge, Hidden, IconButton, Toolbar } from "@material-ui/core";
import MenuIcon from "@material-ui/icons/Menu";
import NotificationsIcon from "@material-ui/icons/NotificationsOutlined";
import InputIcon from "@material-ui/icons/Input";
import AccountBoxIcon from "@material-ui/icons/AccountBox";
import LogoTiLoc from "assets/images/logos/logo-tiloc.png";
import { useSelector } from "react-redux";
import { getGravatarUrl } from "react-awesome-gravatar";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import { useTranslation } from "react-i18next";

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
  appLogo: {
    verticalAlign: "text-bottom"
  },
  appName: {
    color: "white",
    fontSize: "2em"
  },
}));

const Topbar = props => {
  const { className, onSidebarOpen, ...rest } = props;

  const classes = useStyles();

  const { t } = useTranslation();
  const [notifications] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const user = useSelector(store => store.auth.user);

  const avatar = getGravatarUrl(user.email, {
    default: "mp"
  });

  const handleClickUser = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar
      {...rest}
      className={clsx(classes.root, className)}
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
        <div className={classes.flexGrow}/>
        <Hidden smDown>
          <IconButton color="inherit">
            <Badge
              badgeContent={notifications.length}
              color="primary"
              variant="dot"
            >
              <NotificationsIcon/>
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
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
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
            <MenuItem>
              <ListItemIcon>
                <InputIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t("Logout")} />
            </MenuItem>
          </Menu>
        </Hidden>
        <Hidden mdUp>
          <IconButton
            color="inherit"
            onClick={onSidebarOpen}
          >
            <MenuIcon/>
          </IconButton>
        </Hidden>
      </Toolbar>
    </AppBar>
  );
};

Topbar.propTypes = {
  className: PropTypes.string,
  onSidebarOpen: PropTypes.func
};

export default Topbar;
