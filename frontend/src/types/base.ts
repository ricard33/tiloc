import { TFunction } from "i18next";

export interface Pagination<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

export interface AppInfo {
  loaded: boolean;
  version: string;
  frontendVersion: string;
  buildDate: string;
  canRegister: boolean;
  isDebug: boolean;
  isDemo: boolean;
}

const t = (s: string) => s;

export class BookingStatus {
  color: string;
  name: string;
  _label: string;

  // [key: string]: BookingStatus;

  static NotAvailable = new BookingStatus("not available", t('Not available'), '#8f8f8f')
  static Option = new BookingStatus("option", t("Option"), '#E0CB99')
  static ContractSent = new BookingStatus("contract sent", t("Contract sent"), '#FAACEA')
  static DepositPaid = new BookingStatus("deposit paid", t("Deposit paid"), '#D3D3F5')
  static PaymentOnArrival = new BookingStatus("payment on arrival", t("Payment on arrival"), '#FADCE6')
  static Paid = new BookingStatus("paid", t("Paid"), '#B6E69E')
  static External = new BookingStatus("external", t("External"), '#DDDDDD')

  constructor(name: string, label: string, color: string) {
    this.name = name;
    this._label = label;
    this.color = color;
  }

  getLabel = (t: TFunction) => {
    return t(this._label);
  }

}
