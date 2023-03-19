import React, { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import {
  AppBar,
  AppBarProps,
  Avatar,
  Badge,
  Hidden,
  IconButton,
  Theme,
  Toolbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/NotificationsOutlined";
import InputIcon from "@mui/icons-material/Input";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import LogoTiLoc from "../../../assets/images/logos/logo-tiloc.png";
import { useDispatch, useSelector } from "react-redux";
import { getGravatarUrl } from "../../../components/Gravatar";
import { useTranslation } from "react-i18next";
import { auth } from "../../../actions";
import { useLogoutMutation } from "../../../services/api";
import { fetchErrorDecode } from "../../../common/apiUtils";
import { useAlert } from "../../../common/alertUtils";
import logger from "../../../common/logger";
import { RootState } from "../../../store";
import { User } from "../../../types";

const useStyles = makeStyles((theme: Theme) => ({
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
  },
  avatar: {}
}));

export interface TopbarProps extends AppBarProps {
  className?: string;
  onSidebarOpen: (event: React.MouseEvent) => void;
}

const Topbar: React.FC<TopbarProps> = (props) => {
  const { className, onSidebarOpen, ...rest } = props;

  const classes = useStyles();

  const { t } = useTranslation();
  const [notifications] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState<EventTarget | null>(null);
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [doLogout] = useLogoutMutation();
  const { showError } = useAlert();

  const avatar = getGravatarUrl(user.email, {
    default: "mp"
  });

  const handleClickUser: React.MouseEventHandler = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorEl(null);
  };

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
          anchorEl={anchorEl as Element}
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

export default Topbar;
