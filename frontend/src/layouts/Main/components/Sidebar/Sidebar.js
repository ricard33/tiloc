import React, { useEffect, useState } from "react";
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import { Drawer } from '@material-ui/core';
import DashboardIcon from '@material-ui/icons/Dashboard';
import GroupIcon from '@material-ui/icons/Group';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import SettingsIcon from '@material-ui/icons/Settings';
import CalendarIcon from '@material-ui/icons/CalendarToday';
import ListIcon from '@material-ui/icons/List';
import MoneyIcon from '@material-ui/icons/AttachMoney';
import { parseISO } from "date-fns";

import { SidebarNav } from './components';
import { useTranslation } from "react-i18next";
import axios from "axios";
import { formatDate } from "../../../../common/dateUtils";

const useStyles = makeStyles(theme => ({
  drawer: {
    width: 160,
    [theme.breakpoints.up('md')]: {
      marginTop: 64,
      height: 'calc(100% - 64px)'
    }
  },
  root: {
    backgroundColor: theme.palette.white,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: theme.spacing(2)
  },
  divider: {
    margin: theme.spacing(2, 0)
  },
  nav: {
    marginBottom: theme.spacing(2)
  },
  version: {
    fontSize: "x-small",
    position: "fixed",
    bottom: "4px"
  }
}));

const Sidebar = props => {
  const { open, variant, onClose, className, ...rest } = props;

  const classes = useStyles();
  const { t } = useTranslation();
  const [version, setVersion] = useState({});

  const pages = [
    {
      title: t('Dashboard'),
      href: '/dashboard',
      icon: <DashboardIcon />
    },
    {
      title: t('Planning'),
      href: '/planning',
      icon: <CalendarIcon />
    },
    {
      title: t('Bookings'),
      href: '/bookings',
      icon: <ListIcon />
    },
    {
      title: t('Prices'),
      href: '/prices',
      icon: <MoneyIcon />
    },
    {
      title: t('Contacts'),
      href: '/contacts',
      icon: <GroupIcon />
    },
    {
      title: t('My account'),
      href: '/account',
      icon: <AccountBoxIcon />
    },
    {
      title: t('Settings'),
      href: '/settings',
      icon: <SettingsIcon />
    }
  ];

  useEffect(() => {
    axios.get("api/info/")
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
      <div
        {...rest}
        className={clsx(classes.root, className)}
      >
        {/*<Profile />*/}
        {/*<Divider className={classes.divider} />*/}
        <SidebarNav
          className={classes.nav}
          pages={pages}
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

Sidebar.propTypes = {
  className: PropTypes.string,
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired,
  variant: PropTypes.string.isRequired
};

export default Sidebar;
