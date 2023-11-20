import React, { useEffect, useState } from "react";
import Page from "../../layouts/Main/Page";
import { Alert } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import Typography from "@mui/material/Typography";
import PricingTable from "./PricingTable";
import { Outlet } from "react-router-dom";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import LoadingInProgress from "../../components/LoadingInProgress";


function Subscription() {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      {user.account.trial_is_over && <Alert severity="info">
        {t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential.")}
      </Alert>}
      <Outlet />
    </Page>
  );
}

export default Subscription;
