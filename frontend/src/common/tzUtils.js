import { format, parseISO } from "date-fns";

export const shiftPickerDateToUTCDate = (pickerDate) => {
  // console.debug("PickerDate", pickerDate);
  let pickerOffset = pickerDate.getTimezoneOffset();
  let utcDate = new Date();
  utcDate.setTime(pickerDate.getTime() - pickerOffset * 60000);
  return utcDate;
};

export const shiftUTCDateToLocalDate = (utcDate) => {
  if (utcDate) {
    const localDate = new Date();
    const offset = localDate.getTimezoneOffset();
    localDate.setTime((typeof date === "string" ? parseISO(utcDate) : utcDate).getTime() + offset * 60000);

    return localDate;
  }
  return utcDate;
};

export const formatISO: string = (dateWithTZ) => {
  return format(dateWithTZ, 'yyyy-MM-dd');
}
