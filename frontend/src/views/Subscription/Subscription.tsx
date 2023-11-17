import React from "react";
import Page from "../../layouts/Main/Page";
import { Alert, Button, Card, CardActions, CardContent, CardHeader, Chip, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

type Feature = {
  label: string;
  available?: boolean;
  count?: number;
};

function Subscription() {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;

  function renderPlan(plan: {
    ref: string,
    title: string, subtitle: string, price: number, slogan: string,
    features: Feature[]
  }) {
    return (
      <Card sx={{ textAlign: "center" }}>
        <CardHeader
          title={plan.title} subheader={plan.subtitle}
          sx={{ background: "linear-gradient(#f9f9f9, #f9f9f9)" }}
        />
        <CardContent>
          <Typography variant="h1">{t("{{ price }}€ / month", { price: plan.price })}</Typography>
          <Typography variant="body2">{plan.slogan}</Typography>
          <Stack sx={{ textAlign: "left", marginTop: 3 }}>
            {plan.features.map((value) => {
              return <Typography variant={"body1"} sx={{ verticalAlign: "top", height: "2em" }}>
                {typeof value.available !== "undefined" && (
                  value.available
                    ? <CheckCircleOutlineIcon color={"success"} sx={{ marginRight: 1 }} />
                    : <HighlightOffIcon color={"error"} sx={{ marginRight: 1 }} />
                )}
                {typeof value.count !== "undefined" &&
                  <span
                    style={{ verticalAlign: "top", fontWeight: "bold", marginLeft: 8, marginRight: 8 }}
                  >{value.count}</span>}
                <span style={{ verticalAlign: "top" }}>{value.label}</span>
              </Typography>;
            })}
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: "space-around"}}>
          {user.account.subscription.ref === plan.ref
            ? <Chip label={t("Current plan")} />
            : <Button variant="contained">{t("Subscribe")}</Button>
          }
        </CardActions>
      </Card>

    );
  }

  const commonFeatures: Feature[] = [
    { label: t("Global calendar"), available: true },
    { label: t("Manual booking"), available: true },
    { label: t("Generation of contracts"), available: true }
  ];

  const basicFeatures = [
    ...commonFeatures,
    { label: t("Synchronizing calendars"), available: false },
    { label: t("Lodgings"), count: 3 },
    { label: t("Users"), count: 1 },
    { label: t("24/7 Support"), available: false }
  ];

  const proFeatures = [
    ...commonFeatures,
    { label: t("Synchronizing calendars"), available: true },
    { label: t("Lodgings"), count: 3 },
    { label: t("Users"), count: 1 },
    { label: t("24/7 Support"), available: true }
  ];

  const conciergeFeatures = [
    ...commonFeatures,
    { label: t("Synchronizing calendars"), available: true },
    { label: t("Lodgings"), count: 10 },
    { label: t("Users"), count: 10 },
    { label: t("24/7 Support"), available: true }
  ];

  const plans = [
    {
      ref: "FREE",
      title: t("Basic"), subtitle: t("Your first rentals"), price: 0, slogan: t("Always free"),
      features: basicFeatures
    },
    {
      ref: "OWNER",
      title: t("Essential"), subtitle: t("Everything for a tourist rental owner"), price: 10, slogan: t("Few lodgings"),
      features: proFeatures
    },
    {
      ref: "PRO10",
      title: t("Concierge service"), subtitle: t("Multi-property management"), price: 25, slogan: t("More lodgings?"),
      features: conciergeFeatures
    }
  ];

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      {user.account.trial_is_over && <Alert severity="info">
        {t("Your free trial is over. Upgrade to professional to unleash Tiloc’s the full potential.")}
      </Alert>}

      <Typography variant="h1">{t("Plans")}</Typography>
      <Grid container spacing={2}>
        {plans.map((plan) =>
          <Grid sm={4} xs={12}>
            {renderPlan(plan)}
          </Grid>
        )}
      </Grid>
    </Page>
  );
}

export default Subscription;
