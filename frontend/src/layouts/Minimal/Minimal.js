import React from 'react';
import { makeStyles } from '@mui/styles';

import { Topbar } from './components';
import { Outlet } from "react-router-dom";

const useStyles = makeStyles(() => ({
  root: {
    paddingTop: 64,
    height: '100%'
  },
  content: {
    height: '100%'
  }
}));

const Minimal = () => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Topbar />
      <main className={classes.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default Minimal;
