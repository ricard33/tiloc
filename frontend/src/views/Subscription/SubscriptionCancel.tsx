import React from "react";
import { Alert, Button, Card, CardActions, CardContent, CardHeader, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { useNavigate } from "react-router-dom";
import Grid2 from "@mui/material/Unstable_Grid2";
import { formatDate } from "../../common/dateUtils";
import { DecimalPrecision } from "../../common/priceUtils";
import Typography from "@mui/material/Typography";
import FeaturesList from "./FeaturesList";
import { useConfirm } from "../../libs/MuiConfirm";
import axios from "axios";
import { useAlert } from "../../common/alertUtils";
import { auth } from "../../actions";
import { Label, Value } from "../../components";


function SubscriptionCancel() {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useAlert();

  function cancelSubscriptionHandler() {
    confirm({
      title: t("Last chance: cancel your subscription?"),
      description: t("Do you really want to cancel your Tiloc subscription ?")
    }).then(() => {
      console.warn(`Cancelling subscription`);
      axios.post(`/api/subscription/${user.account.current_subscription.id}/cancel/`)
        .then(({ data, status }) => {
          showSuccess(t("Subscription cancelled"));
          dispatch(auth.subscriptionUpdated(data));
          navigate("../subscription");
        })
        .catch((error) => {
          console.error(error);
          showError(t("Error while cancelling subscription."));
        });
    });

  }

  return (
    <>
      <Card sx={{ maxWidth: "500px" }}>
        <CardHeader title={t("Canceling your Subscription")} />
        {
          user.account.current_subscription.cancel_at_period_end ?
            <>
              <CardContent>
                <Alert severity="info">{t("Subscription already canceled")}</Alert>
              </CardContent>
              <CardActions>
                <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
                  <Button onClick={() => navigate(-1)} color="primary">{t("Return")}</Button>
                </Stack>
              </CardActions>
            </>
            :
            <>
              <CardContent>
                <Grid2 container spacing={2}>
                  <Grid2 xs={12}>
                    <Typography variant="h5">{t("Are you sure you want to cancel your subscription?")}</Typography>
                    <Typography variant="body1" color="red">
                      {t("You will loose all your premium advantages:")}
                    </Typography>
                    <FeaturesList
                      features={[
                        { label: t("Synchronizing calendars"), available: false },
                        { label: t("Multi-properties managment"), available: false },
                        { label: t("Multi users"), available: false },
                        { label: t("24/7 Support"), available: false }
                      ]}
                    />
                  </Grid2>
                  <Label xs={5}>{t("Current plan")}</Label>
                  <Value xs={7}>{user.account.current_plan.name}</Value>
                  <Label xs={5}>{t("Renewal")}</Label>
                  <Value xs={7}>{user.account.current_plan.interval === "monthly" ? t("Monthly") : t("Yearly")}</Value>
                  <Label xs={5}>{t("Price")}</Label>
                  <Value xs={7}>{user.account.current_plan.interval === "monthly"
                    ? t("{{amount}} € / month", { amount: DecimalPrecision.round(user.account.current_plan.price) })
                    : t("{{amount}} € / year", { amount: DecimalPrecision.round(user.account.current_plan.price) })
                  }
                  </Value>
                  <Grid2 xs={12}>
                    <Typography variant="body1">
                      {t("Your subscription will be cancelled at the end of the current billing period:")}
                      <strong>{formatDate(user.account.validity, "PPPP")}</strong>
                    </Typography>
                  </Grid2>
                </Grid2>
              </CardContent>
              <CardActions>
                <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
                  <Button onClick={() => navigate(-1)} color="success">{t("Keep my current subscription")}</Button>
                  <Button onClick={() => cancelSubscriptionHandler()} color="error">{t("Cancel subscription")}</Button>
                </Stack>
              </CardActions>
            </>
        }
      </Card>
    </>
  );
}

export default SubscriptionCancel;
