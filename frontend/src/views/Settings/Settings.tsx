import React from "react";
import { Typography } from "@mui/material";
import { SidebarNav } from "../../layouts/Main/components/Sidebar/components";
import { useTranslation } from "react-i18next";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import HolidayVillage from "@mui/icons-material/HolidayVillage";
import RoomServiceIcon from '@mui/icons-material/RoomService';
import GradingIcon from '@mui/icons-material/Grading';
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
      title: t('Owners'),
      href: './owners',
      icon: <PeopleAltIcon />
    },
    {
      title: t('Lodgings'),
      href: './lodgings',
      icon: <HolidayVillage />
    },
    {
      title: t('Booking statuses'),
      href: './booking_status',
      icon: <GradingIcon />
    },
    {
      title: t('Services'),
      href: './services',
      icon: <RoomServiceIcon />
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
        {t("Settings")}
      </Typography>
      <SidebarNav
        pages={pages}
        className=""
      />
    </Page>
  );
};

export default Settings;
