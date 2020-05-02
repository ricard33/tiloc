
export const getDepositLabel = (t, depositLabel) => {
  return {
    deposit: t("Deposit"),
    down_payment: t("Down payment")
  }[depositLabel];
}
