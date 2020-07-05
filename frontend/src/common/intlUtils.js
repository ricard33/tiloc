import i18n from "i18next";

export const getLanguage = () => {
  return i18n.language ||
    (typeof window !== "undefined" && window.localStorage.i18nextLng) ||
    "en";
};

export const formatCurrency = (number, precision = 2) => {
  return new Intl.NumberFormat(getLanguage(), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  }).format(number);
};
