import React from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { Link } from "react-router-dom";
import Grid2 from "@mui/material/Unstable_Grid2";
import { styled } from "@mui/material/styles";
import { formatDate } from "../../common/dateUtils";
import { DecimalPrecision } from "../../common/priceUtils";


function Subscription() {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;

  const Label = styled(Grid2)(({theme}) => ({
    color: "#7a7a7a",
  }))
  const Value = styled(Grid2)(({theme}) => ({
    color: "#646464",
    textAlign: "right",
    fontWeight: "bold"
  }))

  return (
    <>
      <Card sx={{ maxWidth: "500px" }}>
        <CardHeader title={t("Subscription")} />
        <CardContent>
          <Grid2 container spacing={2}>
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
            <Label xs={5}>{t("Next billing")}</Label>
            <Value xs={7}>{formatDate(user.account.validity, "PPPP")}</Value>

            <Label xs={5}>{t("Credit card")}</Label>
            <Value xs={7}>{user.account.current_subscription.default_payment_method.description}</Value>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            <Button component={Link} to="../prices">{t("Change plan")}</Button>
            <Button color="warning">{t("Cancel subscription")}</Button>
          </Stack>
        </CardActions>
      </Card>
    </>
  );
}

export default Subscription;
