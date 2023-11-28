/* eslint-disable react/no-multi-comp */
import React, { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import { useTheme } from "@mui/material/styles";
import { Alert, Breadcrumbs, Link, Theme, Typography, useMediaQuery } from "@mui/material";
import { Footer, Sidebar, Topbar } from "./components";
import { Link as RouterLink, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import queryString from "query-string";
import CheckoutResult from "../../components/CheckoutResult";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { differenceInCalendarDays } from "date-fns";


const useStyles = makeStyles((theme: Theme) => ({
  root: {
    paddingTop: 56,
    height: "100%",
    [theme.breakpoints.up("sm")]: {
      paddingTop: 64
    }
  },
  shiftContent: {
    paddingLeft: 170
  },
  content: {
    height: "100%",
    display: "flex",
    flexFlow: "column"
  },
  breadcrumb: {
    padding: `0 ${theme.spacing(1)}`
  }
}));

const Main = () => {
  const classes = useStyles();
  const { t } = useTranslation();
  const theme = useTheme();
  const location = useLocation();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"), {
    defaultMatches: true
  });
  const [openSidebar, setOpenSidebar] = useState(false);
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const query = queryString.parse(location.search) as { subscription_id: string };
  const { subscription_id } = query;

  const breadcrumbNameMap: { [key: string]: string | undefined, } = {
    "dashboard": t("Dashboard"),
    "planning": t("Planning"),
    "bookings": t("Bookings"),
    "payments": t("Payments"),
    "guests": t("Guests"),
    "settings": t("Settings"),
    "users": t("Users"),
    "contract-templates": t("Contract templates"),
    "contract": t("Contract"),
    "lodgings": t("Lodgings"),
    "reports": t("Reports"),
    "services": t("Services"),
    "booking-channels": t("Booking channels"),
    "calendar-syncs": t("Calendars synchronization"),
    "profile": t("My profile"),
    "account": t("My account"),
    "subscription": t("Subscription")
  };


  const handleSidebarOpen = () => {
    setOpenSidebar(!openSidebar);
  };

  const handleSidebarClose = () => {
    setOpenSidebar(false);
  };

  const shouldOpenSidebar = isDesktop ? true : openSidebar;
  const pathnames = location.pathname.split("/").filter((x) => x);
  const trialDaysLeft = user.account.current_subscription && user.account.current_subscription.status === "trialing"
    ? differenceInCalendarDays(user.account.current_subscription.current_period_end, new Date())
    : -1
  ;

  return (
    <div
      className={clsx({
        [classes.root]: true,
        [classes.shiftContent]: isDesktop
      })}
    >
      <Topbar onSidebarOpen={handleSidebarOpen} />
      <Sidebar
        onClose={handleSidebarClose}
        open={shouldOpenSidebar}
        variant={isDesktop ? "permanent" : "temporary"}
      />
      <main className={classes.content}>
        <Breadcrumbs className={classes.breadcrumb} aria-label="breadcrumb">
          <Link color="inherit" component={RouterLink} to="/">
            {t("Home")}
          </Link>
          {pathnames.map((value, index) => {
            const last = index === pathnames.length - 1;
            const to = `/${pathnames.slice(0, index + 1).join("/")}/`;

            return last ? (
              <Typography color="textPrimary" key={to}>
                {breadcrumbNameMap[to] || breadcrumbNameMap[value] || value}
              </Typography>
            ) : (
              <Link color="inherit" component={RouterLink} to={to} key={to}>
                {breadcrumbNameMap[to] || breadcrumbNameMap[value] || value}
              </Link>
            );
          })}
        </Breadcrumbs>
        {subscription_id && <CheckoutResult subscriptionId={subscription_id} />}
        {trialDaysLeft >= 0 &&
          <Alert
            severity={trialDaysLeft > 5 ? "info" : trialDaysLeft > 2 ? "warning" : "error"}
            style={{ marginBottom: "1em" }}
          >
            {t("End of trial period in {{count}} days.", { count: trialDaysLeft })}
          </Alert>}
        <Outlet />
        <Footer />
      </main>
    </div>
  );
};

Main.propTypes = {
  children: PropTypes.node
};

export default Main;
