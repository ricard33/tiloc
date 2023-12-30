import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { AppBar, AppBarProps, IconButton, Toolbar, Tooltip } from "@mui/material";
import LogoTiloc from "../../../../assets/images/logos/logo-tiloc-with-name.png";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../../../store";
import { User } from "../../../../types";
import { useAuth } from "../../../../common/authUtils";
import ChatwootWidget from "../../../../components/ChatwootWidget";

export interface TopbarProps extends AppBarProps {
  className?: string;
}

const Topbar: React.FC<TopbarProps> = (props) => {
  const { className, ...rest } = props;
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const {logout} = useAuth();

  const handleSignOut: React.MouseEventHandler = event => {
    event.preventDefault();
    logout();
  };


  return (
    <AppBar
      {...rest}
      className={className}
      style={{boxShadow: "none"}}
      color="primary"
      position="fixed"
    >
      <Toolbar>
        <RouterLink to="/">
          <img
            style={{ verticalAlign: "text-bottom" }}
            alt="Logo"
            src={LogoTiloc}
            width="110"
          />
        </RouterLink>
        <div style={{ flexGrow: 1 }} />
        <ChatwootWidget token={"F9GGzGyKirYZ5uipLprdTxU2"} showHelpIcon />
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
