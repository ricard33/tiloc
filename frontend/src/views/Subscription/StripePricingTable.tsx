import React, { useEffect } from "react";

type Props = {
  pricingTableId: string;
  publishableKey: string;
}
const StripePricingTable = (props: Props) => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);
  return React.createElement("stripe-pricing-table", {
    "pricing-table-id": props.pricingTableId,
    "publishable-key": props.publishableKey
  });
};
export default StripePricingTable;

