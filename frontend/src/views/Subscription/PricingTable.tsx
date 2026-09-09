import { useTranslation } from "react-i18next";
import { Account } from "../../types";
import { Button, Card, CardActions, CardContent, CardHeader, Chip, Stack, Switch } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Plan } from "./subscription_types";
import FeaturesList from "./FeaturesList";
import { HighlightBadge } from "../../components";
import { getIntervalLabel, getSubscriptionPlans } from "../../common/subscriptionPlans";
import { useAppSelector } from "../../app/hooks";


const PricingTable = () => {
  const { t } = useTranslation();
  const account = useAppSelector(store => store.auth.account) as Account;
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const currentPlanRef = account.current_plan ? account.current_plan.ref : "FREE";

  useEffect(() => {
    axios.get("/api/prices/")
      .then(() => {
        // setClientSecret(response.data.clientSecret);
      });
  }, []);


  function onChangeInterval() {
    setInterval(interval === "yearly" ? "monthly" : "yearly");
  }

  function renderPlan(plan: Plan) {
    const mostPopular = plan.ref === "OWNER" && interval === "monthly";
    const isCurrentPlan = currentPlanRef === plan.ref || currentPlanRef === `${plan.ref}-${interval.toUpperCase()}`;
    return (
      <Card key={plan.ref} sx={{ textAlign: "center", maxWidth: "20em", margin: "0 auto" }}>
        <CardHeader
          title={<>{plan.title}{mostPopular &&
            <HighlightBadge label={t("MOST POPULAR")} sx={{ marginLeft: 2 }} color="warning" size="small" />}</>}
          subheader={plan.subtitle}
          sx={{ background: "linear-gradient(#f9f9f9, #f9f9f9)", minHeight: "7em" }}
        />
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1em" }}>
            {plan.price[interval] > 0 ?
              <Stack direction="row" style={{}}>
                <span style={{ fontSize: "3em" }}>{t("{{ price }}€", { price: plan.price[interval] })}</span>
                <Stack style={{ fontSize: "1.2em", paddingTop: "0.2em", marginLeft: "0.3em", textAlign: "left" }}>
                  <span style={{}}>{t("per")}</span>
                  <span style={{}}>{getIntervalLabel(interval, t)}</span>
                </Stack>
              </Stack>
              :
              <span style={{ fontSize: "3em" }}>{t("Free", {context: "price"})}</span>
            }
          </div>
          {/*<Typography variant="body2">{plan.slogan}</Typography>*/}
          <FeaturesList features={plan.features} />
        </CardContent>
        <CardActions sx={{ justifyContent: "space-around" }}>
          {isCurrentPlan
            ? <Chip label={t("Current plan")} />
            :
            <Button
              variant="contained" component={Link} to={plan.ref === "FREE" ? "../cancel" : "../checkout"}
              state={{ plan: plan, interval }}
            >
              {
                plan.ref === "FREE"
                  ? t("Choose")
                  : (!account.current_subscription ? t("Subscribe") : t("Change"))
              }</Button>
          }
        </CardActions>
      </Card>

    );
  }


  return (
    <>
      <Typography variant="h1">{t("Plans")}</Typography>
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
        <Typography>{t("Monthly")}</Typography>
        <Switch checked={interval === "yearly"} onClick={() => onChangeInterval()} />
        <Typography>{t("Yearly")}</Typography>
      </Stack>
      <Grid container spacing={2}>
        {getSubscriptionPlans(t).map((plan, index) =>
          <Grid key={index} sm={4} xs={12}>
            {renderPlan(plan)}
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default PricingTable;
