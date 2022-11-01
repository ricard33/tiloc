import React from "react";
import { Typography } from "@mui/material";
import { SidebarNav } from "../../layouts/Main/components/Sidebar/components";
import { useTranslation } from "react-i18next";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import HolidayVillage from "@mui/icons-material/HolidayVillage";
import Page from "../../layouts/Main/Page";


const Settings = () => {
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
    <Page>
      <Typography variant="h4">
        Settings
      </Typography>
      <SidebarNav
        pages={pages}
      />
    </Page>
  );
};

export default Settings;
