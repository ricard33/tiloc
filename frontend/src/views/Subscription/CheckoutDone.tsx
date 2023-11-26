import React from "react";
import { Link, useLocation } from "react-router-dom";
import queryString from "query-string";
import { useTranslation } from "react-i18next";
import CheckoutResult from "../../components/CheckoutResult";
import { Button } from "@mui/material";

type Props = {};

const CheckoutDone = (props: Props) => {
  const { t } = useTranslation();
  const location = useLocation();
  const query = queryString.parse(location.search) as { subscription_id: string };
  const { subscription_id } = query;

  return <>
    <CheckoutResult subscriptionId={subscription_id} />
    <Button component={Link} to={"/"}>{t("Go to Dashboard")}</Button>
  </>;
};

export default CheckoutDone;
