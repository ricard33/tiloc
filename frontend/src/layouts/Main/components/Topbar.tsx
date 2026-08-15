import React from "react";
import { Link, Link as RouterLink } from "react-router-dom";
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
  Toolbar
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import InputIcon from "@mui/icons-material/Input";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import LogoTiloc from "../../../assets/images/logos/logo-tiloc-with-name.png";
import { useSelector } from "react-redux";
import { getGravatarUrl } from "../../../components/Gravatar";
import { useTranslation } from "react-i18next";
import { RootState } from "../../../store";
import { Account, User } from "../../../types";
import NotificationButton from "../../../components/NotificationButton";
import { useAuth } from "../../../common/authUtils";
import { useAppSelector } from "../../../app/hooks";

export interface TopbarProps extends AppBarProps {
  onSidebarOpen: (event: React.MouseEvent) => void;
}

const Topbar: React.FC<TopbarProps> = (props) => {
  const { onSidebarOpen, ...rest } = props;

  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<EventTarget | null>(null);
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const account = useAppSelector(store => store.auth.account) as Account;
  const { logout } = useAuth();

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
      sx={{ boxShadow: "none" }}
    >
      <Toolbar>
        <Hidden mdUp>
          <IconButton
            sx={{ color: "white", marginRight: "20px" }}
            onClick={onSidebarOpen}
            size="large"
          >
            <MenuIcon />
          </IconButton>
        </Hidden>
        <RouterLink to="/">
          <img
            style={{ verticalAlign: "text-bottom" }}
            alt="Logo"
            src={LogoTiloc}
            width="110"
          />
          {/*<span style={{color: "white", fontSize: "2em"}}>Tiloc</span>*/}
        </RouterLink>
        <div style={{flexGrow: 1}} />
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
              <span style={{ fontSize: "0.7em" }}>{t("ID:")}&nbsp;{account.id}</span>
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
