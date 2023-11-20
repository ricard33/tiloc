import React, { useState } from "react";
import { StripeError } from "@stripe/stripe-js";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import LoadingInProgress from "../../components/LoadingInProgress";
import { Alert, AlertTitle, Button } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Plan } from "./subscription_types";
import axios from "axios";

type Props = {
  plan: Plan;
  interval: "monthly" | "yearly";
};

const CheckoutForm = (props: Props) => {
  const { plan, interval } = props;
  const { t } = useTranslation();
  // Initialize an instance of stripe.
  const stripe = useStripe();
  const elements = useElements();
  // const [paymentIntent, setPaymentIntent] = useState<PaymentIntent>();
  const [message, setMessage] = useState("");
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const [testMode, setTestMode] = useState(true);
  const [loading, setLoading] = useState(false);

  console.log("origin:", window.location.origin);
  console.log(`${window.location.protocol}//${window.location.host}`);

  if (!stripe || !elements) {
    // Stripe.js has not loaded yet. Make sure to disable
    // form submission until Stripe.js has loaded.
    return <LoadingInProgress />;
  }
  // When the subscribe-form is submitted we do a few things:
  //
  //   1. Tokenize the payment method
  //   2. Create the subscription
  //   3. Handle any next actions like 3D Secure that are required for SCA.
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (!stripe) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      console.error("Payment submission error", submitError);
      handleError(submitError);
      return;
    }

    console.log(`Create subscription for ${plan.ref} ${interval}`);
    const result = await axios.post("/api/subscription/", {
      plan: `${plan.ref}-${interval.toUpperCase()}`
    });
    const {type, clientSecret} = result.data;
    const confirmIntent = type === "setup" ? stripe.confirmSetup : stripe.confirmPayment;

    // Confirm the Intent using the details collected by the Payment Element
    const {error} = await confirmIntent({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/upgrade-plan/checkout-done?session_id={CHECKOUT_SESSION_ID}`
      },
      // Uncomment below if you only want redirect for redirect-based payments
      // redirect: "if_required",
    });

    if (error) {
      console.error("Payment confirmation error", error);
      // show error and collect new card details.
      handleError(error!);
      return;
    }
  };

  function handleError(error: StripeError) {
    setLoading(false);
    // show error and collect new card details.
    setMessage(error.message!);
  }

  // if (paymentIntent && paymentIntent.status === "succeeded") {
  //   return <Navigate to={{ pathname: "checkout-done" }} replace />;
  // }

  return (
    <div id="checkout">
      {testMode &&
        <Alert severity={"info"} title={"TEST MODE"}>
          <AlertTitle>Test mode</AlertTitle>
          <p>Try the successful test card: <span>4242424242424242</span>.</p>
          <p>Try the test card that requires SCA: <span>4000002500003155</span>.</p>
          <p>Use any <i>future</i> expiry date, CVC,5 digit postal code</p>
        </Alert>
      }

      <hr />
      <form onSubmit={handleSubmit}>
        <Typography variant={"h1"} style={{ marginBottom: "1em" }}>{t("Pay by credit card")}</Typography>
        {/*<label>*/}
        {/*  Full name*/}
        {/*  <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} />*/}
        {/*</label>*/}

        <PaymentElement />

        <Button type="submit" variant={"contained"} disabled={!stripe || loading}>
          Subscribe
        </Button>

        {message && <Alert severity="error">{message}</Alert>}
      </form>
    </div>
  );
};

export default CheckoutForm;
