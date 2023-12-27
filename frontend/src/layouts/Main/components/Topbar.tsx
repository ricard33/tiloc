import React from "react";
import { Link, Link as RouterLink, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import {
  AppBar,
  AppBarProps,
  Avatar,
  Divider,
  Hidden,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Theme,
  Toolbar
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InputIcon from "@mui/icons-material/Input";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import LogoTiloc from "../../../assets/images/logos/logo-tiloc-with-name.png";
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
import NotificationButton from "../../../components/NotificationButton";
import { useAuth } from "../../../common/authUtils";

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
  }
}));

export interface TopbarProps extends AppBarProps {
  className?: string;
  onSidebarOpen: (event: React.MouseEvent) => void;
}

const Topbar: React.FC<TopbarProps> = (props) => {
  const { className, onSidebarOpen, ...rest } = props;

  const classes = useStyles();

  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<EventTarget | null>(null);
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [doLogout] = useLogoutMutation();
  const { showError } = useAlert();
  const {logout} = useAuth();

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
    logout();
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
            src={LogoTiloc}
            width="110"
          />
          {/*<span className={classes.appName}>Tiloc</span>*/}
        </RouterLink>
        <div className={classes.flexGrow} />
        <NotificationButton />
        <Avatar
          alt="Person"
          src={avatar}
          style={{ cursor: "pointer" }}
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
          <Stack direction={"row"} spacing={2} style={{ margin: "5px" }}>
            <Avatar
              alt="Person"
              style={{ width: "80px", height: "80px" }}
              // component={IconButton}
              src={avatar}
            />
            <Stack direction={"column"}>
              <span style={{ fontSize: "1.25em", fontWeight: "bold" }}>{user.full_name}</span>
              <span style={{ fontSize: "0.8em" }}>{user.email}</span>
              <span style={{ fontSize: "0.7em" }}>{t("ID:")}&nbsp;{user.account.id}</span>
            </Stack>
          </Stack>
          <Divider />
          <MenuItem component={Link} to={"/account"} onClick={handleCloseUserMenu}>
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
