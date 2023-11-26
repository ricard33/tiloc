import React, { useEffect, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Alert, AlertTitle } from "@mui/material";

type Props = {
  subscriptionId: string;
};

const CheckoutResult = ({ subscriptionId }: Props) => {
  const { t } = useTranslation();
  const [subscription, setSubscription] = useState<{
    status: string;
  }>();

  useEffect(() => {
    // Get the Checkout Session
    axios.get(`/api/subscription/${subscriptionId}/`)
      .then((response) => setSubscription(response.data));
  }, [subscriptionId]);

  if (!subscription)
    return <></>;

  // console.log(subscription);

  if (subscription.status === "")
    return <Alert severity="info">{t("Processing transaction...")}</Alert>;
  if (subscription.status === "open")
    return <Alert severity="error">{t("Transaction error")}</Alert>;
  if (subscription.status === "active")
    return <>
      <Alert severity="success">
        <AlertTitle>
          {t("Successful transaction")}
        </AlertTitle>
        <p>{t("Your payment has been accepted.")}</p>
        <p>{t("Thank you for your subscription.")}</p>
      </Alert>
    </>;
  return <>
    <Alert severity="warning">
      <AlertTitle>
        {t("Wrong transaction status")}
      </AlertTitle>
      <p>{t("Your subscription is {{ status }}.", {status: subscription.status})}</p>
    </Alert>
  </>;
};

export default CheckoutResult;
