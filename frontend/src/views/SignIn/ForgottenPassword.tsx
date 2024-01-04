import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Alert, AlertTitle, Button, Container, Link, Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { QueryError, useResetPasswordMutation } from "../../services/api";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useForm, useFormState } from "react-hook-form";
import { FormContainer, TextFieldElement } from "react-hook-form-mui";
import { SerializedError } from "@reduxjs/toolkit";


type LoginData = {
  email: string,
}

function ForgottenPassword() {
  const [resetPassword] = useResetPasswordMutation();
  const [done, setDone] = useState(false);

  const formContext = useForm<LoginData>();
  const { control, getValues } = formContext;
  const { isDirty, errors } = useFormState({ control });

  const { t } = useTranslation();
  const { showError } = useAlert();

  const handleSubmit = (formData: LoginData) => {
    resetPassword(formData.email).then((result: { data: any } | { error: QueryError | SerializedError }) => {
      const { error } = result as any;
      if (error) {
        showError(t("Reset password error: ") + fetchErrorDecode(error));
        console.log(result);
      } else {
        setDone(true);
      }
    });
  };

  return (
    <Container maxWidth="sm" sx={{ display: "flex", height: "100%", alignItems: "center", width: "fit-content" }}>
      <FormContainer
        onSuccess={handleSubmit}
        formContext={formContext}
      >
        <Paper sx={{ padding: "1em", width: "500px" }}>
          <Stack direction="column" spacing={2} style={{ width: "100%" }}>
            <Typography
              variant="h2"
            >
              {t("Reset password")}
            </Typography>
            {done ?
              <Alert variant="filled" severity="info">
                <AlertTitle>{t("Sending password reset link")}</AlertTitle>
                {t("Please check your email {{email}} to reset your password", {email: getValues().email})}
              </Alert>
              :
              <>
                <Typography
                  color="textSecondary"
                  gutterBottom
                >
                  {t("Please enter your email address so we can send you a link to reset your password.")}
                </Typography>
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
                <Button
                  color="primary"
                  disabled={!isDirty}
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                >
                  {t("Send reset link")}
                </Button>
              </>
            }
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

export default ForgottenPassword;
