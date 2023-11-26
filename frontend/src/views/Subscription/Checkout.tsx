import React, { useEffect, useState } from "react";

import CheckoutForm from "./CheckoutForm";
import { useLocation, useNavigate } from "react-router-dom";
import Grid2 from "@mui/material/Unstable_Grid2";
import {
  Alert,
  Button,
  Container,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import LogoTiloc from "../../assets/images/logos/logo-tiloc-with-name-black.png";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Plan, SubscriptionPreview } from "./subscription_types";
import FeaturesList from "./FeaturesList";
import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import axios from "axios";
import { Elements } from "@stripe/react-stripe-js";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import Paper from "@mui/material/Paper";
import { parseISO } from "date-fns";
import { formatDate } from "../../common/dateUtils";
import { Label, Value } from "../../components";
import { auth } from "../../actions";
import { useConfirm } from "../../libs/MuiConfirm";
import { useAlert } from "../../common/alertUtils";

type Props = {};

const Checkout = (props: Props) => {
  const location = useLocation();
  const plan = location.state?.plan as Plan;
  const interval = location.state?.interval as "monthly" | "yearly";
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const { t } = useTranslation();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null>>();
  const [testMode, setTestMode] = useState(false);
  const [preview, setPreview] = useState<SubscriptionPreview>();
  const confirm = useConfirm();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    // Create a Checkout Session as soon as the page loads
    axios.get("/api/stripe_config/")
      .then((response) => {
        console.log("response.data", response.data);
        setStripePromise(loadStripe(response.data.publishableKey));
        setTestMode(response.data.publishableKey.startsWith("pk_test_"));
      });
  }, []);

  useEffect(() => {
    if (!plan || !interval)
      navigate("..");

    if (user.account.current_subscription && plan && interval) {
      axios.get(`/api/subscription/${user.account.current_subscription.id}/preview/?plan=${plan.ref}-${interval.toUpperCase()}`)
        .then((response) => {
          console.log("preview", response.data);
          setPreview(response.data);
        });
    }
  }, [interval, navigate, plan, plan?.ref, user.account.current_subscription]);

  if (!plan || !interval)
    return <></>;

  const options: StripeElementsOptions = {
    mode: "subscription",
    amount: plan.price[interval] * 100,
    currency: "eur",
    // Fully customizable with appearance API.
    appearance: {/*...*/ }
  };

  function ccyFormat(num: number) {
    return `${num.toFixed(2)} €`;
  }

  function handleChangeSubscription() {
    confirm({
      title: t("Chaging your subscription?"),
      description: t("Do you really want to change your Tiloc subscription ?")
    }).then(() => {
      axios.post(`/api/subscription/${user.account.current_subscription.id}/change/`, {
        plan: `${plan.ref}-${interval.toUpperCase()}`
      })
        .then(({ data, status }) => {
          showSuccess(t("Subscription changed"));
          dispatch(auth.subscriptionUpdated(data));
          navigate("../subscription");
        })
        .catch((error) => {
          console.error(error);
          showError(t("Error while cancelling subscription."));
        });
    });

  }

  const isLoading = (!stripePromise);

  return (
    <div>
      <Grid2 container spacing={2}>
        <Grid2 mdOffset={1} md={4} sm={5} xs={12}>
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
        <Grid2 md={6} sm={7} xs={12}>
          {isLoading ? <Skeleton variant={"rectangular"} height="100%" />
            : !user.account.current_subscription ?
              <Elements stripe={stripePromise} options={options}>
                <CheckoutForm plan={plan} interval={interval!} testMode={testMode} />
              </Elements>
              :
              preview &&
              <>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" colSpan={2}>
                          {t("Details")}
                        </TableCell>
                        <TableCell align="right">{t("Price")}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {preview.lines.map((l: { amount: number, description: string }, index) =>
                        <TableRow key={index}>
                          <TableCell colSpan={2}>{l.description}</TableCell>
                          <TableCell align="right">{ccyFormat(l.amount)}</TableCell>
                        </TableRow>
                      )}
                      <TableRow>
                        <TableCell rowSpan={2} />
                        <TableCell>{t("Subtotal")}</TableCell>
                        <TableCell align="right">{ccyFormat(preview.subtotal)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>{t("Total")}</TableCell>
                        <TableCell align="right">{ccyFormat(preview.total)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                <Grid2 container sx={{ margin: 2 }}>
                  <Label xs={6}>{t("Billing date:")}</Label>
                  <Value xs={6}>{formatDate(parseISO(preview.period_end), "PPPP")}</Value>
                </Grid2>
                {preview.total < 0 &&
                  <Alert severity="info">
                    {t("You will have a credit that will be used to pay next bills until it will be exhausted.")}
                  </Alert>
                }
                <hr style={{ margin: "2em" }} />
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                  <Button variant="contained" onClick={() => handleChangeSubscription()}>
                    {t("Change subscription")}
                  </Button>
                </div>
              </>
          }
        </Grid2>
      </Grid2>
    </div>
  );
};

export default Checkout;
