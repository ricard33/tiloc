import React from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import Page from "../../layouts/Main/Page";
import { Alert } from "@mui/material";
import { differenceInCalendarDays } from "date-fns";

const Account = () => {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      {user.account.trial_is_over && <Alert severity="info" style={{marginBottom: "1em"}}>
        {t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential.")}
      </Alert>}
      <Outlet />
    </Page>
  );
};

export default Account;
