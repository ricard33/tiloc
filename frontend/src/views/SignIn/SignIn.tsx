import React, { useEffect } from "react";
import { Link as RouterLink, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button, Container, Link, Paper, Stack, Typography } from "@mui/material";

import { auth } from "../../actions";
import { useTranslation } from "react-i18next";
import { QueryError, useLoginMutation } from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { RootState } from "../../store";
import { useForm, useFormState } from "react-hook-form";
import { LoginInfo } from "../../types";
import { CheckboxElement, FormContainer, TextFieldElement } from "react-hook-form-mui";
import { SerializedError } from "@reduxjs/toolkit";
import { useAppSelector } from "../../app/hooks";


type LoginData = {
  email: string,
  password: string,
  keep_connected: boolean;
}

function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isDemo } = useAppSelector((store) => store.appInfo);
  const isAuthenticated = useSelector<RootState>(store => store.auth.isAuthenticated);
  const [doLogin] = useLoginMutation();
  let location = useLocation();
  let { from } = location.state || { from: { pathname: "/" } };

  const formContext = useForm<LoginData>();
  const { control, setValue } = formContext;
  const { isDirty, errors } = useFormState({ control });

  const { t } = useTranslation();
  const { showError } = useAlert();

  useEffect(() => {
    if (isDemo) {
      console.log("set demo identifiers");
      setValue("email", "admin@app.tiloc.fr", { shouldDirty: true, shouldTouch: true });
      setValue("password", "admin", { shouldDirty: true, shouldTouch: true });
    }
  }, [isDemo, setValue]);

  useEffect(() => {
    if (isAuthenticated) {
      console.debug("Redirect to", from);
      navigate(from, { replace: false });
    }
  }, [from, navigate, isAuthenticated]);

  const handleSignIn = (formData: LoginData) => {
    doLogin({
      email: formData.email,
      password: formData.password,
      keep_connected: formData.keep_connected
    }).then((result: { data: LoginInfo } | { error: QueryError | SerializedError }) => {
      const { data, error } = result as any;
      if (error) {
        showError(t("Login error: ") + fetchErrorDecode(error));
        console.log(result);
        dispatch(auth.loginFailed(data));
      } else {
        dispatch(auth.loginSuccessful(data));
      }
    });
  };

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  return (
    <Container maxWidth="sm" sx={{ display: "flex", height: "100%", alignItems: "center", width: "fit-content" }}>
      <FormContainer
        onSuccess={handleSignIn}
        formContext={formContext}
      >
        <Paper sx={{ padding: "1em", maxWidth: "500px" }}>
          <Stack direction="column" spacing={2} style={{ width: "100%" }}>
            <Typography
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
            {isDemo && <Typography color="orange" gutterBottom>{t("DEMO: use 'admin@app.tiloc.fr' as email")}<br />
              {t("and 'admin' as password")}</Typography>}
            <TextFieldElement
              control={control}
              name="email"
              required
              fullWidth
              error={!!errors.email}
              label={t("Email address")}
              type="email"
              variant="outlined"
              autoComplete="username"
            />
            <TextFieldElement
              control={control}
              name="password"
              required
              error={!!errors.password}
              fullWidth
              label={t("Password")}
              type="password"
              variant="outlined"
              autoComplete="current-password"
            />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <CheckboxElement name="keep_connected" label={t("Remember me")} />
              <Link component={RouterLink} to={"/reset-password"}>{t("Forgotten password")}</Link>
            </Stack>
            <Button
              color="primary"
              disabled={!isDirty}
              fullWidth
              size="large"
              type="submit"
              variant="contained"
            >
              {t("Sign in now")}
            </Button>
            <hr />
            <Typography
              color="textSecondary"
              variant="body1"
            >
              {t("Don't have an account?")}{" "}
              <Link
                component={RouterLink}
                to="/signup"
                variant="h6"
              >
                {t("Sign up")}
              </Link>
            </Typography>
          </Stack>
        </Paper>
      </FormContainer>
    </Container>
  );
}

export default SignIn;
