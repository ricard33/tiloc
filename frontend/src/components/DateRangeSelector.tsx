import { DateRange, DateRangePicker, DefinedRange } from "mui-daterange-picker";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, ButtonGroup, Popover } from "@mui/material";
import DateRangeIcon from "@mui/icons-material/DateRange";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  add,
  addDays,
  addMonths, addSeconds,
  addWeeks,
  addYears,
  differenceInCalendarDays, endOfDay,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format, intervalToDuration,
  isSameDay, startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear, sub,
  subDays
} from "date-fns";
import frLocale from "date-fns/locale/fr";


type Props = {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date, endDate: Date }) => void;
  definedRanges?: DefinedRange[]
};

const DateRangeSelector: React.FunctionComponent<Props> = ({ startDate, endDate, onChange, definedRanges }: Props) => {
  const { t } = useTranslation();
  // const [dateRangePopup, setDateRangePopup] = useState({ open: false, anchorEl: undefined });
  const today = new Date();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [range, setRange] = useState<DateRange>({ startDate, endDate });
  const maxDate = new Date(2100, 12, 31);
  const minDate = new Date(2000, 1, 1);


  const defaultRanges = definedRanges ?? [
    {
      label: t("All"),
      startDate: minDate,
      endDate: maxDate
    },
    {
      label: t("Today"),
      startDate: today,
      endDate: today
    },
    {
      label: t("This week"),
      startDate: startOfWeek(today, { locale: frLocale }),
      endDate: endOfWeek(today, { locale: frLocale })
    },
    {
      label: t("Next week"),
      startDate: startOfWeek(addWeeks(today, 1), { locale: frLocale }),
      endDate: endOfWeek(addWeeks(today, 1), { locale: frLocale })
    },
    {
      label: t("This month"),
      startDate: startOfMonth(today),
      endDate: endOfMonth(today)
    },
    {
      label: t("Next month"),
      startDate: startOfMonth(addMonths(today, 1)),
      endDate: endOfMonth(addMonths(today, 1))
    },
    {
      label: t("This year"),
      startDate: startOfYear(today),
      endDate: endOfYear(today)
    },
    {
      label: t("Next year"),
      startDate: startOfYear(addYears(today, 1)),
      endDate: endOfYear(addYears(today, 1))
    }
  ];

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  const toggle = (target: any) => setAnchorEl(!open ? target : undefined);

  const handleChange = (range: DateRange) => {
    console.log(range);
    setRange(range);
    onChange({ startDate: range.startDate as Date, endDate: range.endDate as Date });
    toggle(undefined);
  };

  const onBack = () => {
    backOrForward(false);
  }

  const onForward = () => {
    backOrForward(true);
  }

  const backOrForward = (isForward: boolean) => {
    if (range.startDate && range.endDate) {
      const duration = intervalToDuration({start: range.startDate, end: startOfDay(addDays(range.endDate, 1))});
      console.log(duration);
      // const days = (differenceInCalendarDays(range.endDate, range.startDate) + 1) * (isForward ? 1 : -1);
      const op = isForward ? add : sub;
      const startDate = op(range.startDate, duration);
      console.log(range.startDate, "-->", startDate)
      const newRange = { startDate: startDate, endDate: endOfDay(subDays(add(startDate, duration), 1)) };
      console.log("New range:", newRange);
      setRange(newRange);
      onChange(newRange);
    }
  };

  const isSameRange = (first: DateRange, second: DateRange) => {
    const { startDate: fStart, endDate: fEnd } = first;
    const { startDate: sStart, endDate: sEnd } = second;
    if (fStart && sStart && fEnd && sEnd) {
      return isSameDay(fStart, sStart) && isSameDay(fEnd, sEnd);
    }
    return false;
  };

  const getRangeLabel = (range: DateRange) => {
    const ranges = defaultRanges.filter(r => isSameRange(r, range));
    if (ranges.length > 0) {
      return ranges[0].label;
    }
    return format(startDate, "dd MMM yyyy", { locale: frLocale }) + " - " +
      format(endDate, "dd MMM yyyy", { locale: frLocale });
  };

  return (
    <ButtonGroup>
      <Button onClick={onBack}><ArrowBackIosIcon /></Button>
      <Button
        aria-describedby={id}
        startIcon={<DateRangeIcon />}
        onClick={(event) => toggle(event.currentTarget)}
      >{getRangeLabel(range)}</Button>
      <Button onClick={onForward}><ArrowForwardIosIcon /></Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
      >
        <DateRangePicker
          open
          toggle={() => toggle(undefined)}
          onChange={handleChange}
          definedRanges={defaultRanges}
          initialDateRange={range}
          minDate={minDate}
          maxDate={maxDate}
          locale={frLocale}
        />
      </Popover>
    </ButtonGroup>
  );
};

export default DateRangeSelector;

