import { DateRangePicker, DateRange } from "mui-daterange-picker";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Popover } from "@mui/material";
import DateRangeIcon from "@mui/icons-material/DateRange";
import {
  addMonths,
  addWeeks, addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  startOfMonth,
  startOfWeek,
  startOfYear,
  isSameDay, format
} from "date-fns";
import frLocale from "date-fns/locale/fr";


type Props = {
  startDate: Date;
  endDate: Date;
  onChange: (range: { startDate: Date, endDate: Date }) => void;
};

const DateRangeSelector: React.FunctionComponent<Props> = ({ startDate, endDate, onChange }: Props) => {
  const { t } = useTranslation();
  // const [dateRangePopup, setDateRangePopup] = useState({ open: false, anchorEl: undefined });
  const today = new Date();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [range, setRange] = useState<DateRange>({startDate, endDate});


  const defaultRanges = [
    {
      label: t('Today'),
      startDate: today,
      endDate: today,
    },
    {
      label: t('This week'),
      startDate: startOfWeek(today, {locale: frLocale}),
      endDate: endOfWeek(today, {locale: frLocale}),
    },
    {
      label: t('Next week'),
      startDate: startOfWeek(addWeeks(today, 1), {locale: frLocale}),
      endDate: endOfWeek(addWeeks(today, 1), {locale: frLocale}),
    },
    {
      label: t('This month'),
      startDate: startOfMonth(today),
      endDate: endOfMonth(today),
    },
    {
      label: t('Next month'),
      startDate: startOfMonth(addMonths(today, 1)),
      endDate: endOfMonth(addMonths(today, 1)),
    },
    {
      label: t('This year'),
      startDate: startOfYear(today),
      endDate: endOfYear(today),
    },
    {
      label: t('Next year'),
      startDate: startOfYear(addYears(today, 1)),
      endDate: endOfYear(addYears(today, 1)),
    },
  ];

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popper' : undefined;

  const toggle = (target: any) => setAnchorEl(!open ? target : undefined);

  const handleChange = (range: DateRange) => {
    console.log(range);
    setRange(range);
    onChange({ startDate: range.startDate as Date, endDate: range.endDate as Date });
    toggle(undefined)
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
    const ranges = defaultRanges.filter(r => isSameRange(r, range))
    if(ranges.length > 0) {
      return ranges[0].label;
    }
    return format(startDate, 'dd MMM yyyy', {locale: frLocale}) + ' - ' +
      format(endDate, 'dd MMM yyyy', {locale: frLocale})
  }

  return (
    <div>
      <Button
        aria-describedby={id}
        startIcon={<DateRangeIcon />}
        onClick={(event) => toggle(event.currentTarget)}
      >{getRangeLabel(range)}</Button>
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
          locale={frLocale}
        />
      </Popover>
    </div>
  );
};

export default DateRangeSelector;

