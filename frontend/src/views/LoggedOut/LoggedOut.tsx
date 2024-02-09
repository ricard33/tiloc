import React from "react";
import { Box, Button, Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";

const LoggedOut = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ padding: 4 }}>
      <Grid
        container
        justifyContent="center"
        spacing={4}
      >
        <Grid
          item
          lg={6}
          xs={12}
        >
          <div style={{ paddingTop: "150px", textAlign: "center" }}>
            <Typography variant="h1">
              {t("You are now logged out.")}
            </Typography>
            <Typography variant="subtitle2">
              {t("Click on \"Log in\" button to sign in again.")}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              component={NavLink}
              to="/login"
            >
              {t("Log in")}
            </Button>
          </div>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LoggedOut;
