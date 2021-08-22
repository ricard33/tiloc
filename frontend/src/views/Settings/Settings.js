import React from "react";
import { makeStyles } from "@material-ui/styles";
import { Typography } from "@material-ui/core";
import { SidebarNav } from "../../layouts/Main/components/Sidebar/components";
import { useTranslation } from "react-i18next";
import DashboardIcon from "@material-ui/icons/Dashboard";
import SettingsIcon from "@material-ui/icons/Settings";

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
