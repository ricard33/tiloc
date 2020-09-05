import React from 'react';
import { makeStyles } from '@material-ui/styles';
import { Button, Grid, ListItem, Typography } from "@material-ui/core";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(4)
  },
  content: {
    paddingTop: 150,
    textAlign: 'center'
  },
  image: {
    marginTop: 50,
    display: 'inline-block',
    maxWidth: '100%',
    width: 560
  }
}));

const LoggedOut = () => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div className={classes.root}>
      <Grid
        container
        justify="center"
        spacing={4}
      >
        <Grid
          item
          lg={6}
          xs={12}
        >
          <div className={classes.content}>
            <Typography variant="h1">
              {t('You are now logged out.')}
            </Typography>
            <Typography variant="subtitle2">
              {t('Click on "Log in" button to sign in again.')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              className={classes.button}
              component={NavLink}
              to="/login"
            >
              {t('Log in')}
            </Button>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

export default LoggedOut;
