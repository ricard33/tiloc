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
