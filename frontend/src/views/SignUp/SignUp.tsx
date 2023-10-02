import React from "react";

import { Link as RouterLink, useParams } from "react-router-dom";
import { useGetUserQuery } from "../../services/api";
import { Trans, useTranslation } from "react-i18next";
import { useAlert } from "../../common/alertUtils";
import { User } from "../../types";
import { useConfirm } from "../../libs/MuiConfirm";
import { FormContainer, PasswordElement, PasswordRepeatElement, TextFieldElement } from "react-hook-form-mui";
import { Button, Container, Link, Paper, Typography, Unstable_Grid2 as Grid2 } from "@mui/material";
import { useForm } from "react-hook-form";

export function SignUp() {
  const { t } = useTranslation();
  let { userId } = useParams();
  const {
    data: user,
    isLoading
  } = useGetUserQuery(Number(userId), { skip: typeof userId === "undefined" });
  const { showError, showSuccess } = useAlert();
  const confirm = useConfirm();
  const formContext = useForm<User>({
    defaultValues: user ?? {
      is_active: true
    }
  });
  const { formState } = formContext;
  const { isDirty } = formState;

  const onSubmit = (data: User) => {
    console.log(data);
  };

  // console.log(error)
  if (isLoading) return <div>{t("Loading...")}</div>;
  return (
    <Container maxWidth="sm" sx={{ display: "flex", height: "100%", alignItems: "center" }}>
      <FormContainer
        onSuccess={onSubmit}
        formContext={formContext}
      >
        <Paper sx={{ padding: "1em" }}>
          <input type="hidden" name={"id"} value={user ? user.id : 0} />
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <Typography variant="h2">{t("Sign up")}</Typography>
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
            <Grid2 xs={12}>
              <Button
                type={"submit"} color={"primary"} variant="contained"
                size="large" disabled={!isDirty}
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
      </FormContainer>
    </Container>
  );
}
