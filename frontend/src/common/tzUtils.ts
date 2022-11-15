import { format, parseISO } from "date-fns";

export const shiftPickerDateToUTCDate = (pickerDate: { getTimezoneOffset: () => any; getTime: () => number; }) => {
  // console.debug("PickerDate", pickerDate);
  let pickerOffset = pickerDate.getTimezoneOffset();
  let utcDate = new Date();
  utcDate.setTime(pickerDate.getTime() - pickerOffset * 60000);
  return utcDate;
};

export const shiftUTCDateToLocalDate = (utcDate: Date) => {
  if (utcDate) {
    const localDate = new Date();
    const offset = localDate.getTimezoneOffset();
    localDate.setTime(utcDate.getTime() + offset * 60000);

    return localDate;
  }
  return utcDate;
};

export const formatISO = (dateWithTZ: number | Date) => {
  return format(dateWithTZ, 'yyyy-MM-dd');
}
