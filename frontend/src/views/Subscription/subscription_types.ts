export type Feature = {
  label: string;
  available?: boolean;
  count?: number;
};

export type Plan = {
  ref: string,
  title: string,
  subtitle: string,
  price: { monthly: number, yearly: number },
  slogan: string,
  features: Feature[]
};

export type SubscriptionPreview = {
  lines: { amount: number, description: string }[];
  subtotal: number;
  total: number;
  period_start: string;
  period_end: string;
  subscription_proration_date: string;
};
