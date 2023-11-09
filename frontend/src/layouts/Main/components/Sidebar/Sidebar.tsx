import React, { useEffect, useState } from "react";
import { makeStyles } from "@mui/styles";
import { Drawer, Theme } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
// import AccountBoxIcon from "@mui/icons-material/AccountBox";
import SettingsIcon from "@mui/icons-material/Settings";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MovingIcon from "@mui/icons-material/Moving";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import ListIcon from "@mui/icons-material/List";
// import MoneyIcon from "@mui/icons-material/AttachMoney";
// import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
// import HotelIcon from "@mui/icons-material/Hotel";
// import RoomServiceIcon from "@mui/icons-material/RoomService";
// import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
// import { ReactComponent as BookingSourcesIcon } from "../../../../assets/icones/booking-sources.svg";
// import LocalLaundryServiceIcon from "@mui/icons-material/LocalLaundryService";
import { parseISO } from "date-fns";

import { SidebarNav } from "./components";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { formatDate } from "../../../../common/dateUtils";
import { useLocation } from "react-router-dom";
import BarChartIcon from "@mui/icons-material/BarChart";
// import { useSelector } from "react-redux";
// import { RootState } from "../../../../store";
// import { User } from "../../../../types";

const useStyles = makeStyles((theme: Theme) => ({
  drawer: {
    width: 160,
    marginTop: 48,
    height: "calc(100% - 48px)",
    [theme.breakpoints.up("md")]: {
      marginTop: 64,
      height: "calc(100% - 64px)"
    }
  },
  root: {
    backgroundColor: theme.palette.common.white,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: theme.spacing(2)
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  nav: {
    marginBottom: theme.spacing(2),
    overflow: "scroll"
  },
  version: {
    fontSize: "x-small",
    position: "fixed",
    bottom: "4px"
  }
}));

type Props = {
  open: boolean;
  variant: "permanent" | "persistent" | "temporary" | undefined;
  onClose: () => void;
}


const Sidebar: React.FC<Props> = props => {
  const { open, variant, onClose } = props;

  const classes = useStyles();
  const { t } = useTranslation();
  const [version, setVersion] = useState({ version: "?", build_date: "-" });
  const location = useLocation();
  const locationPathname = location.pathname;
  // const user = useSelector<RootState>(store => store.auth.user) as User;
  // const canViewUsers = user.permissions.includes("core.view_user");

  const menus = [
    {
      url: "/reports",
      pages: [
        { title: t("Back"), href: "/", icon: <ArrowBackIcon /> },
        { title: t("Reports"), href: "/reports", icon: <BarChartIcon /> },
        { title: t("Statistics"), href: "/reports/stats", icon: <MovingIcon /> }
      ]
    },
    // {
    //   url: "/settings",
    //   pages: [
    //     { title: t("Back"), href: "/", icon: <ArrowBackIcon /> },
    //     { title: t("General parameters"), href: "/settings", icon: <SettingsIcon />, disabled: false },
    //     ...(canViewUsers ? [{ title: t("Users"), href: "/settings/users", icon: <PeopleAltIcon /> }] : []),
    //     { title: t("Lodgings"), href: "/settings/lodgings", icon: <HotelIcon /> },
    //     { title: t("Services"), href: "/settings/services", icon: <RoomServiceIcon /> },
    //     { title: t("Contract templates"), href: "/settings/contract-templates", icon: <DashboardIcon /> },
    //     { title: t("Booking channels"), href: "/settings/booking-channels", icon: <BookingSourcesIcon /> },
    //     { title: t("Calendars sync"), href: "/settings/calendar-syncs", icon: <CalendarMonthIcon /> }
    //   ]
    // },
    {
      url: "/",
      pages: [
        { title: t("Dashboard"), href: "/", icon: <DashboardIcon /> },
        { title: t("Planning"), href: "/planning", icon: <CalendarIcon /> },
        { title: t("Bookings"), href: "/bookings", icon: <ListIcon /> },
        // {
        //   title: t("Cleanings"),
        //   href: "https://docs.google.com/spreadsheets/d/1ucUML5Voeydfnss2udi4XZ-Yrb6p8qRXv7VPgAgGwjw/edit?usp=sharing",
        //   icon: <LocalLaundryServiceIcon />,
        //   disabled: false,
        //   external: true
        // },
        { title: t("Payments"), href: "/payments", icon: <PriceCheckIcon /> },
        // { title: t("Reports"), href: "/reports", icon: <MovingIcon />, disabled: true },
        // { title: t("Prices"), href: "/prices", icon: <MoneyIcon />, disabled: true },
        { title: t("Contacts"), href: "/guests", icon: <GroupIcon />, disabled: false },
        // { title: t("My account"), href: "/account", icon: <AccountBoxIcon />, disabled: true },
        { title: t("Settings"), href: "/settings", icon: <SettingsIcon /> }
      ]
    }
  ];

  const currentMenu = menus.filter((menu) =>
    locationPathname === menu.url
    || (locationPathname.startsWith(menu.url) &&
      locationPathname.charAt(menu.url.length) === "/")
    || menu.url === "/"
  )[0];

  useEffect(() => {
    axios.get("/api/info/")
      .then(response => {
        // console.debug(response);
        setVersion({
          version: response.data.version,
          build_date: formatDate(parseISO(response.data.build_date))
        });
      })
      .catch(() => {
      });
  }, []);

  return (
    <Drawer
      anchor="left"
      classes={{ paper: classes.drawer }}
      onClose={onClose}
      open={open}
      variant={variant}
    >
      <div className={classes.root}>
        <SidebarNav
          className={classes.nav}
          pages={currentMenu.pages}
          onClick={onClose}
        />
        {/*<UpgradePlan />*/}
        <div className={classes.version}>
          <div>{t("version")} {version.version}</div>
          <div>{t("build on")} {version.build_date}</div>
        </div>
      </div>
    </Drawer>
  );
};

export default Sidebar;
