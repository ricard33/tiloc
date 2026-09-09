import { getIntervalLabel, getSubscriptionPlan, getSubscriptionPlans } from "./subscriptionPlans";
import type { TFunction } from "i18next";

// The functions only use `t` as an identity-ish translator.
const t = ((s: string) => s) as unknown as TFunction;

describe("Module subscriptionPlans:", () => {
  describe("getSubscriptionPlans()", () => {
    it("returns the FREE, OWNER and PRO10 plans in order", () => {
      expect(getSubscriptionPlans(t).map((p) => p.ref)).toEqual(["FREE", "OWNER", "PRO10"]);
    });

    it("exposes monthly/yearly pricing and a feature list per plan", () => {
      const [free, owner] = getSubscriptionPlans(t);
      expect(free.price).toEqual({ monthly: 0, yearly: 0 });
      expect(owner.price).toEqual({ monthly: 10, yearly: 100 });
      expect(owner.features.length).toBeGreaterThan(0);
    });

    it("marks calendar sync as unavailable on FREE but available on OWNER", () => {
      const [free, owner] = getSubscriptionPlans(t);
      const sync = (features: typeof free.features) =>
        features.find((f) => f.label === "Synchronizing calendars");
      expect(sync(free.features)).toMatchObject({ available: false });
      expect(sync(owner.features)).toMatchObject({ available: true });
    });
  });

  describe("getSubscriptionPlan()", () => {
    it("returns the matching plan", () => {
      expect(getSubscriptionPlan("OWNER", t)?.ref).toEqual("OWNER");
    });

    it("returns undefined for an unknown ref", () => {
      expect(getSubscriptionPlan("NOPE", t)).toBeUndefined();
    });
  });

  describe("getIntervalLabel()", () => {
    it("maps the interval to its translated word", () => {
      expect(getIntervalLabel("monthly", t)).toEqual("month");
      expect(getIntervalLabel("yearly", t)).toEqual("year");
    });
  });
});
