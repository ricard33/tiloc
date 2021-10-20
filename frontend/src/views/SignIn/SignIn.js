import React, { useState, useEffect } from 'react';
import { Link as RouterLink, Redirect, withRouter, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from 'prop-types';
import validate from 'validate.js';
import { makeStyles } from '@mui/styles';
import {
  Grid,
  Button,
  IconButton,
  TextField,
  Link,
  Typography
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { auth } from "../../actions";
import { useTranslation } from "react-i18next";
import { useLoginMutation } from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";

const schema = {
  email: {
    presence: { allowEmpty: false, message: 'is required' },
    email: true,
    length: {
      maximum: 64
    }
  },
  password: {
    presence: { allowEmpty: false, message: 'is required' },
    length: {
      maximum: 128
    }
  }
};

const useStyles = makeStyles(theme => ({
  root: {
    // backgroundColor: theme.palette.background.default,
    height: '100%'
  },
  grid: {
    height: '100%'
  },
  content: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  contentHeader: {
    display: 'flex',
    alignItems: 'center',
    paddingTop: theme.spacing(5),
    paddingBototm: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2)
  },
  contentBody: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('lg')]: {
      justifyContent: 'center'
    }
  },
  form: {
    paddingLeft: 100,
    paddingRight: 100,
    paddingBottom: 125,
    flexBasis: 700,
    [theme.breakpoints.down('md')]: {
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2)
    }
  },
  title: {
    marginTop: theme.spacing(3)
  },
  textField: {
    marginTop: theme.spacing(2)
  },
  signInButton: {
    margin: theme.spacing(2, 0)
  }
}));

const SignIn = props => {
  const { history } = props;
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(store => store.auth.isAuthenticated);
  const [doLogin, ] = useLoginMutation();
  const classes = useStyles();
  let location = useLocation();
  let { from } = location.state || { from: { pathname: "/" } };
  const [formState, setFormState] = useState({
    isValid: false,
    values: {},
    touched: {},
    errors: {}
  });
  const { t } = useTranslation();
  const { showError } = useAlert();

  useEffect(() => {
    const errors = validate(formState.values, schema);

    setFormState(formState => ({
      ...formState,
      isValid: !errors,
      errors: errors || {}
    }));
  }, [formState.values]);

  useEffect(() => {
    if (isAuthenticated) {
      console.debug("Redirect to", from);
      history.replace(from);
    }
  }, [from, history, isAuthenticated]);

  const handleBack = () => {
    history.goBack();
  };

  const handleChange = event => {
    event.persist();

    setFormState(formState => ({
      ...formState,
      values: {
        ...formState.values,
        [event.target.name]:
          event.target.type === 'checkbox'
            ? event.target.checked
            : event.target.value
      },
      touched: {
        ...formState.touched,
        [event.target.name]: true
      }
    }));
  };

  const handleSignIn = event => {
    event.preventDefault();
    doLogin({username: formState.values.email, password: formState.values.password}).then((result)=> {
      const {data, error} = result;
      if(error) {
        showError(t("Login error: ") + fetchErrorDecode(error));
        console.log(result);
        dispatch(auth.loginFailed(data));
      }
      else {

        dispatch(auth.loginSuccessful(data));
      }
    })
  };

  const hasError = field =>
    !!(formState.touched[field] && formState.errors[field]);

  if (isAuthenticated) {
    return <Redirect to="/" />
  }

  return (
    <div className={classes.root}>
      <Grid
        className={classes.grid}
        container
      >
        <Grid
          className={classes.content}
          item
          lg={7}
          xs={12}
        >
          <div className={classes.content}>
            <div className={classes.contentHeader}>
              <IconButton onClick={handleBack} size="large">
                <ArrowBackIcon />
              </IconButton>
            </div>
            <div className={classes.contentBody}>
              <form
                className={classes.form}
                onSubmit={handleSignIn}
              >
                <Typography
                  className={classes.title}
                  variant="h2"
                >
                  {t("Sign in")}
                </Typography>
                <Typography
                  color="textSecondary"
                  gutterBottom
                >
                  {t("Sign in with email address")}
                </Typography>
                <TextField
                  className={classes.textField}
                  error={hasError('email')}
                  fullWidth
                  helperText={
                    hasError('email') ? formState.errors.email[0] : null
                  }
                  label={t("Email address")}
                  name="email"
                  onChange={handleChange}
                  type="email"
                  value={formState.values.email || ''}
                  variant="outlined"
                />
                <TextField
                  className={classes.textField}
                  error={hasError('password')}
                  fullWidth
                  helperText={
                    hasError('password') ? formState.errors.password[0] : null
                  }
                  label={t("Password")}
                  name="password"
                  onChange={handleChange}
                  type="password"
                  value={formState.values.password || ''}
                  variant="outlined"
                />
                <Button
                  className={classes.signInButton}
                  color="primary"
                  disabled={!formState.isValid}
                  fullWidth
                  size="large"
                  type="submit"
                  // variant="contained"
                >
                  {t("Sign in now")}
                </Button>
                <Typography
                  color="textSecondary"
                  variant="body1"
                >
                  {t("Don't have an account?")}{' '}
                  <Link
                    component={RouterLink}
                    to="/sign-up"
                    variant="h6"
                  >
                    {t("Sign up")}
                  </Link>
                </Typography>
              </form>
            </div>
          </div>
        </Grid>
      </Grid>
    </div>
  );
};

SignIn.propTypes = {
  history: PropTypes.object
};

export default withRouter(SignIn);
