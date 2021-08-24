import { formatCurrency, getLanguage } from "./intlUtils";

describe("Module intlUtils:", () => {

  describe("formatCurrency", () => {
    it("should rounding value with 2 digit precision", () => {
      expect(getLanguage()).toEqual('en')
      expect(formatCurrency(124.459)).toEqual('€124.46')
      expect(formatCurrency(120.00)).toEqual('€120.00')
    });
  });
});
