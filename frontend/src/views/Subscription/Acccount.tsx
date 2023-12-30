import React from "react";
import { Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Account } from "../../types";
import Page from "../../layouts/Main/Page";
import { Alert } from "@mui/material";
import { useAppSelector } from "../../app/hooks";

const MyAccount = () => {
  const { t } = useTranslation();
  const account = useAppSelector(store => store.auth.account) as Account;

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      {account.trial_is_over && <Alert severity="info" style={{marginBottom: "1em"}}>
        {t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential.")}
      </Alert>}
      <Outlet />
    </Page>
  );
};

export default MyAccount;
