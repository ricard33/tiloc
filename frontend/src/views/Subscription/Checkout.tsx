import React, { useEffect, useState } from "react";

import CheckoutForm from "./CheckoutForm";
import { useLocation } from "react-router-dom";
import Grid2 from "@mui/material/Unstable_Grid2";
import { Container, Skeleton, Stack } from "@mui/material";
import LogoTiloc from "../../assets/images/logos/logo-tiloc-with-name-black.png";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Plan } from "./subscription_types";
import FeaturesList from "./FeaturesList";
import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";

type Props = {};

const Checkout = (props: Props) => {
  const location = useLocation();
  const { plan, interval }: { plan: Plan, interval: "monthly" | "yearly" } = location.state;
  const { t } = useTranslation();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null>>();

  useEffect(() => {
    // Create a Checkout Session as soon as the page loads
    axios.get("/api/stripe_config/")
      .then((response) => {
        console.log("response.data", response.data);
        setStripePromise(loadStripe(response.data.publishableKey));
      });
  }, []);

  const options: StripeElementsOptions = {
    mode: "subscription",
    amount: plan.price[interval] * 100,
    currency: "eur",
    // Fully customizable with appearance API.
    appearance: {/*...*/ }
  };

  console.log(stripePromise);
  const isLoading = (!stripePromise);

  return (
    <div>
      <Grid2 container spacing={2}>
        <Grid2 sm={6} xs={12}>
          <Stack style={{ textAlign: "center" }}>
            <div>
              <img
                alt="Logo"
                src={LogoTiloc}
                width="110"
              />
            </div>
            <Typography variant={"h1"} style={{ margin: "20px" }}>
              {t("Upgrade to {{plan}} plan", { plan: plan.title })}
            </Typography>
            <Typography variant={"h2"} style={{ margin: "20px" }}>{interval === "monthly"
              ? t("{{amount}}€ / month", { amount: plan.price.monthly })
              : t("{{amount}}€ / year", { amount: plan.price.yearly })
            }</Typography>
            <Container>
              <FeaturesList features={plan.features} style={{ margin: "auto", width: "fit-content" }} />
            </Container>
          </Stack>

        </Grid2>
        <Grid2 sm={6} xs={12}>
          {isLoading ? <Skeleton variant={"rectangular"} height="100%" />
            :
            <Elements stripe={stripePromise} options={options}>
              <CheckoutForm plan={plan} interval={interval!} />
            </Elements>
          }
        </Grid2>
      </Grid2>
    </div>
  );
};

export default Checkout;
