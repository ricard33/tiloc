import React, { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { makeStyles, useTheme } from "@material-ui/styles";
import { Breadcrumbs, Link, Typography, useMediaQuery } from "@material-ui/core";
import { Sidebar, Topbar, Footer } from "./components";
import { Route, Link as RouterLink } from "react-router-dom";


const breadcrumbNameMap = {
  '/dashboard': 'Dashboard',
  '/planning': 'Planning',
  '/bookings': 'Bookings',
  '/settings': 'Settings',
  'contract-templates': 'Contract templates',
  'contract': 'Contract',
};


const LinkRouter = (props) => <Link {...props} component={RouterLink} />;

const useStyles = makeStyles(theme => ({
  root: {
    paddingTop: 56,
    height: "100%",
    [theme.breakpoints.up("sm")]: {
      paddingTop: 64
    }
  },
  shiftContent: {
    paddingLeft: 160
  },
  content: {
    height: "100%"
  },
  breadcrumb: {
    padding: `0 ${theme.spacing(1)}px`,
  }
}));

const Main = props => {
  const { children } = props;

  const classes = useStyles();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"), {
    defaultMatches: true
  });

  const [openSidebar, setOpenSidebar] = useState(false);

  const handleSidebarOpen = () => {
    setOpenSidebar(true);
  };

  const handleSidebarClose = () => {
    setOpenSidebar(false);
  };

  const shouldOpenSidebar = isDesktop ? true : openSidebar;

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
        variant={isDesktop ? "persistent" : "temporary"}
      />
      <main className={classes.content}>
        <Route>
          {({ location }) => {
            const pathnames = location.pathname.split("/").filter((x) => x);

            return (
              <Breadcrumbs className={classes.breadcrumb} aria-label="breadcrumb">
                <LinkRouter color="inherit" to="/">
                  Home
                </LinkRouter>
                {pathnames.map((value, index) => {
                  const last = index === pathnames.length - 1;
                  const to = `/${pathnames.slice(0, index + 1).join("/")}/`;

                  return last ? (
                    <Typography color="textPrimary" key={to}>
                      {breadcrumbNameMap[to] || breadcrumbNameMap[value] || value}
                    </Typography>
                  ) : (
                    <LinkRouter color="inherit" to={to} key={to}>
                      {breadcrumbNameMap[to] || breadcrumbNameMap[value] || value}
                    </LinkRouter>
                  );
                })}
              </Breadcrumbs>
            );
          }}
        </Route>
        {children}
        <Footer />
      </main>
    </div>
  );
};

Main.propTypes = {
  children: PropTypes.node
};

export default Main;
