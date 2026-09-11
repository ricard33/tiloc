import { DateRange as MuiDateRange, DateRangePicker, DefinedRange } from "mui-daterange-picker";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonGroup, Popover } from "@mui/material";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  add,
  addDays,
  addMonths, addWeeks,
  addYears,
  endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format, intervalToDuration,
  isSameDay, startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear, sub,
  subDays, subMonths, subWeeks, subYears
} from "date-fns";
import frLocale from "date-fns/locale/fr";


export interface DateRange {
  startDate: Date;
  endDate: Date;
}

type Props = {
  startDate?: Date;
  endDate?: Date;
  onChange: (range: DateRange) => void;
  rangeNames?: RangeNames[],
  definedRanges?: DefinedRange[]
};

export enum RangeNames {
  All = "ALL",
  Today = "TODAY",
  LastWeek = "LAST_WEEK",
  ThisWeek = "THIS_WEEK",
  NextWeek = "NEXT_WEEK",
  LastMonth = "LAST_MONTH",
  ThisMonth = "THIS_MONTH",
  NextMonth = "NEXT_MONTH",
  LastYear = "LAST_YEAR",
  ThisYear = "THIS_YEAR",
  NextYear = "NEXT_YEAR"
}

const DateRangeSelector: React.FunctionComponent<Props> = ({ startDate, endDate, onChange, rangeNames, definedRanges }: Props) => {
  const { t } = useTranslation();
  // const [dateRangePopup, setDateRangePopup] = useState({ open: false, anchorEl: undefined });
  const today = new Date();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const maxDate = new Date(2100, 12, 31);
  const minDate = new Date(2000, 1, 1);
  const [range, setRange] = useState<MuiDateRange>({
    startDate: startDate ?? minDate,
    endDate: endDate ?? maxDate
  });

  const selectedRangeNames = rangeNames || Object.values(RangeNames);
  const displayedRanges = [
    ...(selectedRangeNames.indexOf(RangeNames.All) > -1 ? [{ label: t("All"), startDate: minDate, endDate: maxDate }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.Today) > -1 ? [{ label: t("Today"), startDate: today, endDate: today }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.LastWeek) > -1 ? [{ label: t("Last week"), startDate: startOfWeek(subWeeks(today, 1), { locale: frLocale }), endDate: endOfWeek(subWeeks(today, 1), { locale: frLocale }) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.ThisWeek) > -1 ? [{ label: t("This week"), startDate: startOfWeek(today, { locale: frLocale }), endDate: endOfWeek(today, { locale: frLocale }) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.NextWeek) > -1 ? [{ label: t("Next week"), startDate: startOfWeek(addWeeks(today, 1), { locale: frLocale }), endDate: endOfWeek(addWeeks(today, 1), { locale: frLocale }) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.LastMonth) > -1 ? [{ label: t("Last month"), startDate: startOfMonth(subMonths(today, 1)), endDate: endOfMonth(subMonths(today, 1)) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.ThisMonth) > -1 ? [{ label: t("This month"), startDate: startOfMonth(today), endDate: endOfMonth(today) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.NextMonth) > -1 ? [{ label: t("Next month"), startDate: startOfMonth(addMonths(today, 1)), endDate: endOfMonth(addMonths(today, 1)) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.LastYear) > -1 ? [{ label: t("Last year"), startDate: startOfYear(subYears(today, 1)), endDate: endOfYear(subYears(today, 1)) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.ThisYear) > -1 ? [{ label: t("This year"), startDate: startOfYear(today), endDate: endOfYear(today) }] : []),
    ...(selectedRangeNames.indexOf(RangeNames.NextYear) > -1 ? [{ label: t("Next year"), startDate: startOfYear(addYears(today, 1)), endDate: endOfYear(addYears(today, 1)) }] : []),
    ...(definedRanges ?? [])
  ]

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  const toggle = (target: any) => setAnchorEl(!open ? target : undefined);

  const handleChange = (range: MuiDateRange) => {
    console.log(range);
    setRange(range);
    onChange({ startDate: range.startDate as Date, endDate: range.endDate as Date });
    toggle(undefined);
  };

  const onBack = () => {
    backOrForward(false);
  };

  const onForward = () => {
    backOrForward(true);
  };

  const backOrForward = (isForward: boolean) => {
    if (range.startDate && range.endDate) {
      const duration = intervalToDuration({ start: range.startDate, end: startOfDay(addDays(range.endDate, 1)) });
      console.log(duration);
      // const days = (differenceInCalendarDays(range.endDate, range.startDate) + 1) * (isForward ? 1 : -1);
      const op = isForward ? add : sub;
      const startDate = op(range.startDate, duration);
      console.log(range.startDate, "-->", startDate);
      const newRange = { startDate: startDate, endDate: endOfDay(subDays(add(startDate, duration), 1)) };
      console.log("New range:", newRange);
      setRange(newRange);
      onChange(newRange);
    }
  };

  const isSameRange = (first: MuiDateRange, second: MuiDateRange) => {
    const { startDate: fStart, endDate: fEnd } = first;
    const { startDate: sStart, endDate: sEnd } = second;
    if (fStart && sStart && fEnd && sEnd) {
      return isSameDay(fStart, sStart) && isSameDay(fEnd, sEnd);
    }
    return false;
  };

  const getRangeLabel = (range: MuiDateRange) => {
    const ranges = displayedRanges.filter(r => isSameRange(r, range));
    if (ranges.length > 0) {
      return ranges[0].label;
    }
    return format(range.startDate ?? minDate, "dd MMM yyyy", { locale: frLocale }) + " - " +
      format(range.endDate ?? maxDate, "dd MMM yyyy", { locale: frLocale });
  };

  return (
    <>
      <ButtonGroup>
        <Button onClick={onBack}><ArrowBackIosIcon /></Button>
        <Button
          aria-describedby={id}
          startIcon={<DateRangeIcon />}
          onClick={(event) => toggle(event.currentTarget)}
        >{getRangeLabel(range)}</Button>
        <Button onClick={onForward}><ArrowForwardIosIcon /></Button>
      </ButtonGroup>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
      >
        <DateRangePicker
          open
          toggle={() => toggle(undefined)}
          onChange={handleChange}
          definedRanges={displayedRanges}
          initialDateRange={range}
          minDate={minDate}
          maxDate={maxDate}
          locale={frLocale}
        />
      </Popover>
    </>
  );
};

export default DateRangeSelector;

