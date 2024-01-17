import { Feature } from "../views/Subscription/subscription_types";
import { TFunction } from "react-i18next";

export function getSubscriptionPlans(t: TFunction<"translation">) {
  const commonFeatures: Feature[] = [
    { label: t("Global calendar"), available: true },
    { label: t("Manual booking"), available: true },
    { label: t("Generation of contracts"), available: true }
  ];

  const basicFeatures = [
    ...commonFeatures,
    { label: t("Synchronizing calendars"), available: false },
    { label: t("Block bookings"), available: false },
    { label: t("Lodging"), count: 1 },
    { label: t("User"), count: 1 },
    { label: t("Premium support"), available: false }
  ];

  const ownerFeatures = [
    ...commonFeatures,
    { label: t("Synchronizing calendars"), available: true },
    { label: t("Block bookings"), available: false },
    { label: t("Lodgings"), count: 3 },
    { label: t("Users"), count: 1 },
    { label: t("Premium support"), available: true }
  ];

  const proFeatures = [
    ...commonFeatures,
    { label: t("Synchronizing calendars"), available: true },
    { label: t("Block bookings"), available: true },
    { label: t("Lodgings"), count: 10 },
    { label: t("Users"), count: 10 },
    { label: t("Premium support"), available: true }
  ];

  return [
    {
      ref: "FREE",
      title: t("Basic"), subtitle: t("Simple features"), slogan: t("Always free"),
      price: { monthly: 0, yearly: 0 },
      features: basicFeatures
    },
    {
      ref: "OWNER",
      title: t("Essential"), subtitle: t("All the tools to manage your rentals"), slogan: t("Few lodgings"),
      price: { monthly: 10, yearly: 100 },
      features: ownerFeatures
    },
    {
      ref: "PRO10",
      title: t("Professional"),
      subtitle: t("Multi-property management, Concierge service"),
      slogan: t("More lodgings?"),
      price: { monthly: 25, yearly: 250 },
      features: proFeatures
    }
  ];
}

export function getSubscriptionPlan(ref: string, t: TFunction<"translation">) {
  const plan = getSubscriptionPlans(t).filter(p => p.ref === ref);
  if (plan.length > 0)
    return plan[0]
  return undefined;
}

export function getIntervalLabel(interval: "monthly"|"yearly", t: TFunction<"translation">) {

  const intervalLabel = {
    monthly: t("month"),
    yearly: t("year")
  };

  return intervalLabel[interval];
}
