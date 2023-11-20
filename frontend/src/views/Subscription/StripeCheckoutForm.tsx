import React, { useState, useEffect } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import axios from "axios";

// Make sure to call `loadStripe` outside a component’s render to avoid
// recreating the `Stripe` object on every render.
// This is your test public API key.
const stripePromise = loadStripe("pk_test_51ODOT7DHVnzOWZytaNOPfARgKhnHCmlAPy9NW0La9iLd882Ku3jNrdBnj4Ge8hYmllTcN4G3tSIdmlhdh6OYD10R00s0az6bGh");

type Props = {
  plan: string;
  interval: "monthly"|"yearly";
};

const StripeCheckoutForm = (props: Props) => {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // Create a Checkout Session as soon as the page loads
    axios.post("/api/checkout/", {
      plan: props.plan,
      interval: props.interval
    })
      .then((response) => setClientSecret(response.data.clientSecret));
  }, [props.interval, props.plan]);

  return (
    <div id="checkout">
      {clientSecret && (
        <EmbeddedCheckoutProvider
          stripe={stripePromise}
          options={{clientSecret}}
        >
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      )}
    </div>
  )
}

export default StripeCheckoutForm;
