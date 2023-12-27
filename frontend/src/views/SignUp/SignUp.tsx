import React, { useState } from "react";

import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import { QueryError, useSignupMutation } from "../../services/api";
import { Trans, useTranslation } from "react-i18next";
import { useAlert } from "../../common/alertUtils";
import { AppInfo, LoginInfo, SignUpData } from "../../types";
import { FormContainer, PasswordElement, PasswordRepeatElement, TextFieldElement } from "react-hook-form-mui";
import {
  Alert,
  AlertTitle,
  Button,
  Container,
  Link,
  Paper,
  Stack,
  Typography,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useForm } from "react-hook-form";
import { SerializedError } from "@reduxjs/toolkit";
import { fetchErrorDecode } from "../../common/apiUtils";
import { auth } from "../../actions";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import queryString from "query-string";
import { getSubscriptionPlan } from "../../common/subscriptionPlans";
import FeaturesList from "../Subscription/FeaturesList";
import LogoTiloc from "../../assets/images/logos/logo-tiloc-with-name-black.png";


export function SignUp() {
  const { t } = useTranslation();
  const { showError } = useAlert();
  const formContext = useForm<SignUpData>({});
  const { formState, register } = formContext;
  const { isDirty } = formState;
  const [doSignup] = useSignupMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const appInfo = useSelector<RootState>(store => store.appInfo) as AppInfo;
  const location = useLocation();
  const query = queryString.parse(location.search) as { plan: string };
  const plan = query.plan && getSubscriptionPlan(query.plan.split("-")[0], t);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;



  const onSubmit = (formData: SignUpData) => {
    setIsSubmitting(true);
    doSignup(formData).then((result: {
      data: LoginInfo
    } | {
      error: QueryError | SerializedError
    }) => {
      const { data, error } = result as any;
      if (error) {
        showError(t("SignUp error: ") + fetchErrorDecode(error));
        console.log(result);
        setIsSubmitting(false);
      } else {
        dispatch(auth.loginSuccessful(data));
        navigate("/setup");
      }
    });
  };

  // console.log(error)
  if (!appInfo.canRegister) {
    return (
      <Container maxWidth="sm" sx={{ display: "flex", height: "100%", alignItems: "center" }}>
        <Stack>

          <Alert severity="warning">
            <AlertTitle>{t("Signups closed")}</AlertTitle>
            {t("Signups aren't currently opened. Only existing users can signin this application.")}</Alert>
          <Button component={RouterLink} to={"/"} variant="contained">{t("Back")}</Button>
        </Stack>
      </Container>
    );
  }
  return (
    <Container maxWidth={plan ? "md" : "sm"} sx={{ display: "flex", height: "100%", alignItems: "center" }}>
      <FormContainer
        onSuccess={onSubmit}
        formContext={formContext}
      >
        <Stack direction={"row"}>
          {plan &&
            <Paper sx={{padding: 2}}>
              <Stack style={{ textAlign: "center" }}>
                <div>
                  <img alt="Logo" src={LogoTiloc} width="110" />
                </div>
                <Typography variant={"h1"} style={{ margin: "20px" }}>
                  {t("{{plan}} subscription", { plan: plan.title })}
                </Typography>
                <FeaturesList
                  features={plan.features} style={{ margin: "auto", width: "fit-content", minWidth: "300px" }}
                />
              </Stack>
            </Paper>}
          <Paper sx={{ padding: "1em" }}>
            <input type="hidden" {...register("plan")} defaultValue={query.plan} />
            <input type="hidden" {...register("tz")} defaultValue={tz} />
            <Grid2 container spacing={2}>
              <Grid2 xs={12}>
                <Typography variant="h2">
                  {t("Sign up")}
                </Typography>
              </Grid2>
              <Grid2 sm={6} xs={12}>
                <TextFieldElement name={"first_name"} label={t("First name")} fullWidth required />
              </Grid2>
              <Grid2 sm={6} xs={12}>
                <TextFieldElement name={"last_name"} label={t("Last name")} fullWidth required />
              </Grid2>
              <Grid2 xs={12}>
                <TextFieldElement
                  name={"email"} type={"email"} label={t("Email")}
                  fullWidth required autoComplete="email"
                />
              </Grid2>

              <Grid2 sm={6} xs={12}>
                <PasswordElement
                  name={"password"} label={t("Password")} fullWidth
                  autoComplete="new-password"
                  required
                  validation={{
                    minLength: {
                      value: 8,
                      message: t("Password must have at least 8 characters")
                    }
                  }}
                />
              </Grid2>
              <Grid2 sm={6} xs={12}>
                <PasswordRepeatElement
                  passwordFieldName={"password"} name={"password-repeat"}
                  autoComplete="new-password"
                  label={t("Re-type the password")} fullWidth required
                />
              </Grid2>
              { plan && <Grid2 xs={12}>
                <Typography variant="body2">{t("No credit card is required for the trial period")}</Typography>
              </Grid2>}
              <Grid2 xs={12}>
                <Button
                  type={"submit"} color={"primary"} variant="contained"
                  size="large" disabled={!isDirty || isSubmitting}
                  fullWidth
                >{t("Start free trial ")}</Button>
              </Grid2>
              <Grid2 xs={12}>
                <Typography variant="caption" sx={{ textAlign: "center", marginTop: "1em" }}>
                  <Trans
                    i18nKey="With registration, you accept our <link1>privacy policy</link1> and <link2>terms & conditions</link2>"
                    components={{
                      link1:
                        <a
                          href="https://tiloc.fr/mentions-legales/" target="_blank" rel="noreferrer"
                          title={t("Read the privacy policy")}
                        > </a>,
                      link2:
                        <a
                          href="https://tiloc.fr/cgv/" target="_blank" rel="noreferrer"
                          title={t("Read the terms & conditions")}
                        > </a>
                    }}
                  />
                </Typography>
              </Grid2>
              <Grid2 xs={12}>
                <hr />
                <Typography
                  color="textSecondary"
                  variant="body1"
                >
                  {t("Already a member?")}{" "}
                  <Link
                    component={RouterLink}
                    to="/signin"
                    variant="h6"
                  >
                    {t("Sign in")}
                  </Link>
                </Typography>
              </Grid2>
            </Grid2>
          </Paper>
        </Stack>
      </FormContainer>
    </Container>
  );
}
