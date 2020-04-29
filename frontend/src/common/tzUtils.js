import { parseISO } from "date-fns";

export const shiftPickerDateToUTCDate = (pickerDate) => {
  let pickerOffset = pickerDate.getTimezoneOffset();
  let utcDate = new Date();
  utcDate.setTime(pickerDate.getTime() - pickerOffset * 60000);

  // let tzOffset = moment.tz(pickerDate, TZ).utcOffset()
  // let tzDate = new Date()
  // tzDate.setTime(utcDate.getTime() - tzOffset * 60000)
  return utcDate;
};

export const shiftUTCDateToPickerDate = (utcDate) => {
  // let tzUTCOffset = moment.tz(tzDate, TZ).utcOffset()
  // let utcDate = new Date()
  // utcDate.setTime(tzDate.getTime() + tzUTCOffset * 60000)

  if (utcDate) {

    let pickerDate = new Date();
    let pickerOffset = pickerDate.getTimezoneOffset();
    pickerDate.setTime(parseISO(utcDate).getTime() + pickerOffset * 60000);

    return pickerDate;
  }
  return utcDate;
};
