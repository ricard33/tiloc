import React from "react";
import { Tab, Tabs } from "@mui/material";
import { useTranslation } from "react-i18next";
import DashboardIcon from "@mui/icons-material/Dashboard";
import SettingsIcon from "@mui/icons-material/Settings";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import HotelIcon from "@mui/icons-material/Hotel";
import HolidayVillageIcon from "@mui/icons-material/HolidayVillage";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import GradingIcon from "@mui/icons-material/Grading";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { ReactComponent as BookingSourcesIcon } from "../../assets/icones/booking-sources.svg";
import Page from "../../layouts/Main/Page";
import { Link, Outlet, useLocation } from "react-router-dom";

const Settings = () => {
  const { t } = useTranslation();
  const pages = [
    {
      title: t("General parameters"),
      href: "",
      icon: <SettingsIcon />,
      disabled: false
    },
    {
      title: t("Users"),
      href: "users",
      icon: <PeopleAltIcon />,
      disabled: true
    },
    {
      title: t("Properties"),
      href: "properties",
      icon: <HolidayVillageIcon />
    },
    {
      title: t("Lodgings"),
      href: "lodgings",
      icon: <HotelIcon />
    },
    {
      title: t("Booking statuses"),
      href: "booking-status",
      icon: <GradingIcon />
    },
    {
      title: t("Services"),
      href: "services",
      icon: <RoomServiceIcon />
    },
    {
      title: t("Contract templates"),
      href: "contract-templates",
      icon: <DashboardIcon />
    },
    {
      title: t("Booking channels"),
      href: "booking-channels",
      icon: <BookingSourcesIcon style={{ height: "24px" }} />
    },
    {
      title: t("Calendars sync"),
      href: "calendar-syncs",
      icon: <CalendarMonthIcon />
    }
  ];

  const location = useLocation();
  const relativeLocationPathname = location.pathname.startsWith("/settings/")
    ? location.pathname.slice(10)
    : location.pathname;
  const pageIndex = pages.findLastIndex((p) => relativeLocationPathname.startsWith(p.href));

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Tabs value={pageIndex} variant="scrollable" scrollButtons="auto" aria-label="settings pages">
        {pages.map((p) => (
          <Tab
            key={p.href}
            icon={p.icon}
            iconPosition="start"
            label={p.title}
            to={p.href}
            component={Link}
            disabled={p.disabled}
            sx={{ minHeight: 48 }}
          />
        ))}
      </Tabs>
      <Outlet />
    </Page>
  );
};

export default Settings;
