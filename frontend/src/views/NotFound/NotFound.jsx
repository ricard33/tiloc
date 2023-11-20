import React from 'react';
import { makeStyles } from '@mui/styles';
import { Grid, Typography } from '@mui/material';
import PageNotFound from '../../assets/images/undraw_page_not_found_su7k.svg';
import Page from "../../layouts/Main/Page";

const useStyles = makeStyles(theme => ({
  content: {
    paddingTop: "10vh",
    textAlign: 'center'
  },
  image: {
    marginTop: "5vh",
    display: 'inline-block',
    maxWidth: '100%',
    width: "30vw"
  }
}));

const NotFound = () => {
  const classes = useStyles();

  return (
    <Page>
      <Grid
        container
        justifyContent="center"
        spacing={0}
      >
        <Grid
          item
        >
          <div className={classes.content}>
            <Typography variant="h3">
              404: The page you are looking for isn’t here
            </Typography>
            <Typography variant="subtitle2">
              You either tried some shady route or you came here by mistake.
              Whichever it is, try using the navigation
            </Typography>
            <img
              alt="Under development"
              className={classes.image}
              src={PageNotFound}
            />
          </div>
        </Grid>
      </Grid>
    </Page>
  );
};

export default NotFound;
