import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { Button, Card, CardActions, CardContent, CardHeader, Chip, Stack, Switch } from "@mui/material";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Unstable_Grid2";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Feature, Plan } from "./subscription_types";
import FeaturesList from "./FeaturesList";

type Props = {};

const PricingTable = (props: Props) => {
  const { t } = useTranslation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const [interval, setInterval] = useState<"monthly" | "yearly">("yearly");

  useEffect(() => {
    axios.get("/api/prices/")
      .then((response) => {
        // setClientSecret(response.data.clientSecret);
      });
  }, []);


  function onChangeInterval() {
    setInterval(interval === "yearly" ? "monthly" : "yearly");
  }

  const commonFeatures: Feature[] = [
    { label: t("Global calendar"), available: true },
    { label: t("Manual booking"), available: true },
    { label: t("Generation of contracts"), available: true }
  ];

  const basicFeatures = [
    ...commonFeatures,
    { label: t("Synchronizing calendars"), available: false },
    { label: t("Lodging"), count: 1 },
    { label: t("User"), count: 1 },
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
      title: t("Basic"), subtitle: t("Your first rentals"), slogan: t("Always free"),
      price: { monthly: 0, yearly: 0 },
      features: basicFeatures
    },
    {
      ref: "OWNER",
      title: t("Owner"), subtitle: t("Everything for a tourist rental owner"), slogan: t("Few lodgings"),
      price: { monthly: 10, yearly: 100 },
      features: proFeatures
    },
    {
      ref: "PRO10",
      title: t("Professional"), subtitle: t("Multi-property management, Concierge service"), slogan: t("More lodgings?"),
      price: { monthly: 25, yearly: 250 },
      features: conciergeFeatures
    }
  ];
  const intervalLabel = {
    monthly: t("month"),
    yearly: t("year")
  };

  function renderPlan(plan: Plan) {
    return (
      <Card key={plan.ref} sx={{ textAlign: "center" }}>
        <CardHeader
          title={plan.title} subheader={plan.subtitle}
          sx={{ background: "linear-gradient(#f9f9f9, #f9f9f9)" }}
        />
        <CardContent>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "1em" }}>
            <Stack direction="row" style={{}}>
              <span style={{fontSize: "3em"}}>{t("{{ price }}€", { price: plan.price[interval] })}</span>
              <Stack style={{fontSize: "1.2em", paddingTop: "0.2em", marginLeft: "0.3em", textAlign: "left"}}>
                <span style={{}}>{t("per")}</span>
                <span style={{}}>{intervalLabel[interval]}</span>
              </Stack>
            </Stack>
          </div>
          <Typography variant="body2">{plan.slogan}</Typography>
          <FeaturesList features={plan.features} />
        </CardContent>
        <CardActions sx={{ justifyContent: "space-around" }}>
          {user.account.current_plan.ref === `${plan.ref}-${interval.toUpperCase()}`
            ? <Chip label={t("Current plan")} />
            :
            <Button
              variant="contained" component={Link} to={"../checkout"}
              state={{ plan: plan, interval }}
            >{t("Subscribe")}</Button>
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
        {plans.map((plan, index) =>
          <Grid key={index} sm={4} xs={12}>
            {renderPlan(plan)}
          </Grid>
        )}
      </Grid>
    </>
  );
};

export default PricingTable;
