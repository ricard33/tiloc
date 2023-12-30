import React from "react";
import { Alert, Button, Card, CardActions, CardContent, CardHeader, Chip, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Account } from "../../types";
import { Link } from "react-router-dom";
import Grid2 from "@mui/material/Unstable_Grid2";
import { formatDate } from "../../common/dateUtils";
import { DecimalPrecision } from "../../common/priceUtils";
import axios from "axios";
import { subscriptionUpdated } from "../../actions";
import { useConfirm } from "../../libs/MuiConfirm";
import { useAlert } from "../../common/alertUtils";
import { Label, Value } from "../../components";
import { useAppSelector } from "../../app/hooks";


function Subscription() {
  const { t } = useTranslation();
  const account = useAppSelector(store => store.auth.account) as Account;
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useAlert();

  function openCustomerPortal() {
    axios.post(`/api/subscription/${account.current_subscription.id}/create_customer_portal_session/`, {
      return_url: window.location.href
    })
      .then(({ data, status }) => {
        // console.log(data)
        window.location.href = data.url;
        // navigate("../subscription");
      })
      .catch((error) => {
        console.error(error);
        showError(t("Error while creating customer portal session."));
      });

  }

  function reactivateHandler() {
    confirm({
      title: t("Confirmation: reactivate your subscription?"),
      description: t("Your subscription will be immediately reactivated without any service interruption. Renewal payments will take place at the same dates than before cancellation.")
    }).then(() => {
      console.info(`Reactivate subscription`);
      axios.post(`/api/subscription/${account.current_subscription.id}/reactivate/`)
        .then(({ data, status }) => {
          showSuccess(t("Subscription reactivated"));
          dispatch(subscriptionUpdated(data));
          // navigate("../subscription");
        })
        .catch((error) => {
          console.error(error);
          showError(t("Error while reactivating subscription."));
        });
    });
  }

  return (
    <>
      <Card sx={{ maxWidth: "500px" }}>
        <CardHeader title={t("Subscription")} />
        <CardContent>
          {account.current_subscription ?
            <Grid2 container spacing={2}>
              <Label xs={5}>{t("Current plan")}</Label>
              <Value xs={7}>
                {account.current_subscription.status === "trialing" &&
                  <Chip label={t("TRIAL PERIOD")} color="success" size="small" sx={{ marginRight: 1 }} />}
                {account.current_plan.name}
              </Value>
              <Label xs={5}>{t("Renewal")}</Label>
              <Value xs={7}>
                {account.current_subscription.cancel_at_period_end ?
                  <Alert severity="warning">
                    {t("Will be cancelled on {{date}}", { date: formatDate(account.validity, "PPPP") })}
                  </Alert>
                  : account.current_plan.interval === "monthly" ? t("Monthly") : t("Yearly")}</Value>
              <Label xs={5}>{t("Price")}</Label>
              <Value xs={7}>{account.current_plan.interval === "monthly"
                ? t("{{amount}} € / month", { amount: DecimalPrecision.round(account.current_plan.price) })
                : t("{{amount}} € / year", { amount: DecimalPrecision.round(account.current_plan.price) })
              }
              </Value>
              {!account.current_subscription.cancel_at_period_end &&
                <>
                  <Label xs={5}>{t("Next billing")}</Label>
                  <Value xs={7}>{formatDate(account.validity, "PPPP")}</Value>
                </>
              }
              {account.current_subscription.default_payment_method &&
                <>
                  <Label xs={5}>{t("Credit card")}</Label>
                  <Value xs={7}>
                    <Stack direction={"column"}>
                      {account.current_subscription.default_payment_method.description}
                      <span style={{fontWeight: "lighter" }}>{t("Expire: {{month}}/{{year}}", {
                        month: account.current_subscription.default_payment_method.exp_month.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false}),
                        year: account.current_subscription.default_payment_method.exp_year,
                      })}</span>
                    </Stack>
                  </Value>
                </>
              }
              <Label xs={5}>{t("Customer portal")}</Label>
              <Value xs={7}>
                <Button variant="contained" onClick={() => openCustomerPortal()}>
                  {t("Customer portal")}
                </Button>
              </Value>
            </Grid2>
            :
            <Alert severity="warning">{t("No active subscription")}</Alert>
          }
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {account.current_subscription ?
              <>
                <Button component={Link} to="../prices">{t("Change plan")}</Button>
                {account.current_subscription.cancel_at_period_end
                  ? <Button onClick={() => reactivateHandler()} color="primary">{t("Reactivate subscription")}</Button>
                  : <Button component={Link} to="../cancel" color="warning">{t("Cancel subscription")}</Button>
                }
              </>
              :
              <Button component={Link} to="../prices">{t("Subscribe plan")}</Button>
            }
          </Stack>
        </CardActions>
      </Card>
    </>
  );
}

export default Subscription;
