import React from "react";

import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Container, Paper, Typography } from "@mui/material";
import Box from "@mui/material/Box";

export function EmailVerified() {
  const { t } = useTranslation();

  return (
    <Container maxWidth="sm" sx={{ display: "flex", height: "100%", alignItems: "center" }}>
      <Paper sx={{ padding: "1em" }}>
        <Typography variant="h2" sx={{ marginBottom: 1 }}>{t("Email verified")}</Typography>
        <hr />
        <Box sx={{ marginTop: 3 }}>{t("Your email has been verified, thank you!")}</Box>
        <Box sx={{ marginBottom: 5 }}>{t("Now, you can go to your dashboard and use the full power of Tiloc.")}</Box>
        <Box sx={{ textAlign: "center" }}>
          <Button variant="contained" component={Link} to="/">{t("Go to Tiloc Dashboard")}</Button>
        </Box>
      </Paper>
    </Container>
  );
}
