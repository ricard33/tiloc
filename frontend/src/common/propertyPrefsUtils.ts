import { TFunction } from "i18next";

export const getDepositLabel = (t: TFunction, depositLabel: string) => {
  return {
    deposit: t("Deposit"),
    down_payment: t("Down payment")
  }[depositLabel];
}
