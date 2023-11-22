import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import queryString from "query-string";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Alert } from "@mui/material";

type Props = {};

const CheckoutDone = (props: Props) => {
  const { t } = useTranslation();
  const location = useLocation();
  const query = queryString.parse(location.search) as { session_id: string };
  const { session_id } = query;
  const [checkoutSession, setCheckoutSession] = useState({
    status: "",
    customer_email: "",
  });

  useEffect(() => {
    // Get the Checkout Session
    axios.get(`/api/checkout/?session_id=${session_id}`)
      .then((response) => setCheckoutSession(response.data));
  }, [session_id]);

  if(checkoutSession.status === '')
    return <Alert severity="info">{t("Processing transaction...")}</Alert>;
  if(checkoutSession.status === 'open')
    return <Alert severity="error">{t("Transaction error")}</Alert>;
  return <Alert severity="success">{t("Done")}</Alert>;
};

export default CheckoutDone;
