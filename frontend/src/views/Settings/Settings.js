import React from "react";
import { makeStyles } from "@mui/styles";
import { Typography } from "@mui/material";
import { SidebarNav } from "../../layouts/Main/components/Sidebar/components";
import { useTranslation } from "react-i18next";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  },
  nav: {}
}));

const Settings = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const pages = [
    {
      title: t('General parameters'),
      href: 'general',
      icon: <SettingsIcon />,
      disabled: true,
    },
    {
      title: t('Contract templates'),
      href: './contract-templates',
      icon: <DashboardIcon />
    },
  ];


  return (
    <div className={classes.root}>
      <Typography variant="h1">
        Settings
      </Typography>
      <SidebarNav
        className={classes.nav}
        pages={pages}
      />
    </div>
  );
};

export default Settings;
