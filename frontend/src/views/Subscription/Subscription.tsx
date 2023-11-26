import React from "react";
import { Alert, Button, Card, CardActions, CardContent, CardHeader, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { Link, useNavigate } from "react-router-dom";
import Grid2 from "@mui/material/Unstable_Grid2";
import { styled } from "@mui/material/styles";
import { formatDate } from "../../common/dateUtils";
import { DecimalPrecision } from "../../common/priceUtils";
import axios from "axios";
import { auth } from "../../actions";
import { useConfirm } from "../../libs/MuiConfirm";
import { useAlert } from "../../common/alertUtils";


function Subscription() {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const navigate = useNavigate();
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useAlert();

  const Label = styled(Grid2)(({ theme }) => ({
    color: "#7a7a7a"
  }));
  const Value = styled(Grid2)(({ theme }) => ({
    color: "#646464",
    textAlign: "right",
    fontWeight: "bold"
  }));

  function reactivateHandler() {
    confirm({
      title: t("Confirmation: reactivate your subscription?"),
      description: t("Your subscription will be immediately reactivated without any service interruption. Renewal payments will take place at the same dates than before cancellation."),
    }).then(() => {
      console.info(`Reactivate subscription`);
      axios.post(`/api/subscription/${user.account.current_subscription.id}/reactivate/`)
        .then(({data, status}) => {
          showSuccess(t("Subscription reactivated"));
          dispatch(auth.subscriptionUpdated(data));
          // navigate("../subscription");
        })
        .catch((error) => {
          console.error(error);
          showError(t("Error while reactivating subscription."));
        })
    })

  }

  return (
    <>
      <Card sx={{ maxWidth: "500px" }}>
        <CardHeader title={t("Subscription")} />
        <CardContent>
          <Grid2 container spacing={2}>
            <Label xs={5}>{t("Current plan")}</Label>
            <Value xs={7}>{user.account.current_plan.name}</Value>
            <Label xs={5}>{t("Renewal")}</Label>
            <Value xs={7}>{user.account.current_subscription.cancel_at_period_end ?
              <Alert severity="warning"
              >{t("Will be cancelled on {{date}}", { date: formatDate(user.account.validity, "PPPP") })}</Alert>
              : user.account.current_plan.interval === "monthly" ? t("Monthly") : t("Yearly")}</Value>
            <Label xs={5}>{t("Price")}</Label>
            <Value xs={7}>{user.account.current_plan.interval === "monthly"
              ? t("{{amount}} € / month", { amount: DecimalPrecision.round(user.account.current_plan.price) })
              : t("{{amount}} € / year", { amount: DecimalPrecision.round(user.account.current_plan.price) })
            }
            </Value>
            {!user.account.current_subscription.cancel_at_period_end &&
              <>
                <Label xs={5}>{t("Next billing")}</Label>
                <Value xs={7}>{formatDate(user.account.validity, "PPPP")}</Value>
              </>
            }

            <Label xs={5}>{t("Credit card")}</Label>
            <Value xs={7}>{user.account.current_subscription.default_payment_method.description}</Value>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            <Button component={Link} to="../prices">{t("Change plan")}</Button>
            {user.account.current_subscription.cancel_at_period_end
              ? <Button onClick={() => reactivateHandler()} color="primary">{t("Reactivate subscription")}</Button>
              : <Button component={Link} to="../cancel" color="warning">{t("Cancel subscription")}</Button>
            }
          </Stack>
        </CardActions>
      </Card>
    </>
  );
}

export default Subscription;
