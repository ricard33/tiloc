import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Booking, BookingStatus, Lodging } from "../../../types";
import { PlanningSettings } from "../../Planning/components/PlanningSettingsDialog";
import {
  add,
  differenceInCalendarDays, differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getDaysInMonth, isSameDay,
  isWeekend,
  isWithinInterval,
  startOfMonth, sub
} from "date-fns";
import { DateRange } from "../../../components/DateRangeSelector";
import "./TimelineView.scss";
import { getMonthName, getWeekdayName } from "../../../common/dateUtils";
import clsx from "clsx";
import bookingView from "../../../components/BookingView";
import { getBookingStatus, getIconAndBgColor, otaBranding, OtaIconProps } from "../../../common/statusUtils";
import { darken } from "@mui/system";
import EuroIcon from "@mui/icons-material/Euro";
import { useTranslation } from "react-i18next";


type Props = {
  defaultBeginDate?: Date,
  bookings: Booking[],
  disabled: boolean,
  lodgings: Lodging[],
  buffer?: number,
  onCreateBooking?: (lodging: Lodging, startDate: Date) => void,
  onBoundsChange: (canvasStart: Date, canvasEnd: Date, current: Date) => void,
  settings: PlanningSettings,
};

export const TimelineView: React.FC<Props> = props => {
  const { defaultBeginDate, bookings, lodgings, buffer } = {
    defaultBeginDate: startOfMonth(new Date()),
    buffer: 5,
    ...props
  };
  const { t } = useTranslation();
  const dayWidth = 40;
  const dayHeight = 30;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const visibleWidth = dimensions.width;  //2000;
  const [range, setRange] = useState({
    startDate: sub(startOfMonth(defaultBeginDate), { months: (buffer - 1) / 2 }),
    endDate: endOfMonth(add(defaultBeginDate, { months: (buffer - 1) / 2 }))
  });
  // console.log("range=", range.startDate.toDateString(), range.endDate.toDateString());
  const [scrollPos, setScrollPos] = useState(differenceInDays(defaultBeginDate, range.startDate) * dayWidth);
  const [scrollPosUpdate, setScrollPosUpdate] = useState(scrollPos);
  const [loadedPos, setLoadedPos] = useState({ date: defaultBeginDate, pos: scrollPos });
  const ref = useRef<HTMLDivElement>(null);
  const commonDayStyle = {
    height: `${dayHeight}px`,
    minHeight: `${dayHeight}px`
  };

  useEffect(() => {
    if (ref.current) {
      console.log("Set scroll to ", scrollPosUpdate);
      ref.current.scrollLeft = scrollPosUpdate;
    }
  }, [scrollPosUpdate]);

  useLayoutEffect(() => {
    console.log("useLayoutEffect");
    const measure = () => {
      if (ref.current)
        setDimensions({ width: ref.current.offsetWidth, height: ref.current.offsetHeight });
    };
    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, []);

  function updateBounds(visibleArea: { left: number, right: number }) {
    console.log("updateBounds", visibleArea, "width=", visibleWidth);
    const start = add(loadedPos.date, { days: (visibleArea.left - loadedPos.pos) / dayWidth });
    const end = add(loadedPos.date, { days: (visibleArea.right - loadedPos.pos) / dayWidth });
    console.info("updateBounds", start.toDateString(), end.toDateString());
    const width = (visibleArea.right - visibleArea.left) / dayWidth;
    const offsetInDays = width * (buffer - 1) / 2;
    const newRange = {
      startDate: startOfMonth(sub(start, { days: offsetInDays })),
      endDate: endOfMonth(add(end, { days: offsetInDays }))
    };
    props.onBoundsChange && props.onBoundsChange(
      newRange.startDate,
      newRange.endDate,
      start
    );
    setRange(newRange);
    const newScrollPos = differenceInCalendarDays(start, newRange.startDate) * dayWidth;
    setLoadedPos({ date: start, pos: newScrollPos });
    setScrollPosUpdate(newScrollPos);
  }

  function getMonths(range: DateRange) {
    return eachMonthOfInterval({ start: range.startDate, end: range.endDate }).map(d => {
      return {
        date: d,
        label: `${getMonthName(d)} ${d.getFullYear()}`,
        size: getDaysInMonth(d)
      };
    });
  }

  function getDays(range: DateRange) {
    const today = new Date();
    return eachDayOfInterval({ start: range.startDate, end: range.endDate }).map(d => {
      return {
        date: d,
        label: format(d, "dd"),
        weekDay: getWeekdayName(d),
        isWeekend: isWeekend(d),
        isToday: isSameDay(today, d)
      };
    });
  }

  function getDaysWithBookings(lodging?: Lodging) {
    return getDays(range).map(e => {
      const booking = bookings
        .find(b =>
          (
            lodging
              ? b.lodgings.find(l => l.id === lodging.id) && !b.cancelled
              : b.cancelled)
          && isWithinInterval(e.date, { start: b.begin_date, end: b.end_date })
        );
      return {
        ...e,
        booking: booking && isSameDay(booking.begin_date, e.date) ? booking : undefined,
        isBusy: booking && !isSameDay(booking.end_date, e.date)
      };
    });
  }

  function getBookingItem(booking: Booking) {
    const statusProp = booking.status === BookingStatus.External.name
      ? getIconAndBgColor(booking)
      : {
        color: "black",
        bgColor: getBookingStatus(booking.status).color,
        selectedBgColor: darken(getBookingStatus(booking.status).color, 0.1)
      };

    return (
      <div
        className="item"
        style={{
          width: (dayWidth * booking.duration - 0.1 * dayWidth) + "px",
          // color: "black",
          color: statusProp.color,
          backgroundColor: statusProp.bgColor,
          opacity: !booking.cancelled ? undefined : "50%"
        }}
      >
        {statusProp.icon ? statusProp.icon : ""}
        <div className="item-title">{booking.lodgings.length > 1 &&
          <span>{"\uD83D"}{"\uDD17"} </span>}{booking.guest_name}</div>
        {booking.price && booking.price > 0 ?
          <EuroIcon
            className={clsx("item-icon", booking.left_to_pay > 0 ? "partially-paid" : "fully-paid")}
            style={{ height: `100%` }}
          /> : ""}
      </div>
    );
  }

  function handleScroll(event: React.UIEvent<HTMLDivElement, UIEvent>) {
    const pos = event.currentTarget.scrollLeft;
    // console.log("handleScroll", pos);
    setScrollPos(pos);
    const limit = (buffer - 1) * visibleWidth / 2 / 2;
    console.log("handleScroll", limit);
    if (pos < loadedPos.pos - limit || pos > loadedPos.pos + limit) {
      updateBounds({ left: pos, right: pos + visibleWidth });
    }
  }

  return (
    <div className="timeline-view">
      <div className="table-responsive" onScroll={handleScroll} ref={ref}>
        <table className="table">
          <thead>
            <tr className="first-tr">
              <th className="lodging-name"></th>
              {getMonths(range).map((m) => {
                return <th key={m.date.valueOf()} colSpan={m.size}>
                  <div className="month">
                    <div className="month-label">{m.label}</div>
                  </div>
                </th>;
              })}
            </tr>
            <tr className="second-tr">
              <th className="lodging-name"></th>
              {getDays(range).map((d) => {
                return <th
                  key={d.date.valueOf()} className={clsx("day", { weekend: d.isWeekend, today: d.isToday })}
                  style={commonDayStyle}
                >{d.label}</th>;
              })}
            </tr>
            <tr className="third-tr">
              <th className="lodging-name"></th>
              {getDays(range).map((d) => {
                return (
                  <th
                    key={d.date.valueOf()} className={clsx("day", { weekend: d.isWeekend, today: d.isToday })}
                    style={commonDayStyle}
                  >{d.weekDay}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {lodgings.map(l =>
              <tr key={l.id}>
                <td className="lodging-name" style={commonDayStyle} title={l.name}>{l.name}</td>
                {getDaysWithBookings(l).map((d) => {
                  return (
                    <td
                      key={d.date.valueOf()} className={clsx("day", { weekend: d.isWeekend, today: d.isToday })}
                      style={commonDayStyle}
                    >
                      {!d.isBusy && <div className="day-price">{l.daily_rate} €</div>}
                      {d.booking && getBookingItem(d.booking)}
                    </td>
                  );
                })}
              </tr>
            )}
            <tr key={-1}>
              <td
                className="lodging-name cancelled" style={commonDayStyle} title={t("Cancellation / Waiting")}
              >{t("Cancellation")}</td>
              {getDaysWithBookings().map((d) => {
                return (
                  <td
                    key={d.date.valueOf()} className={clsx("day", { weekend: d.isWeekend, today: d.isToday })}
                    style={commonDayStyle}
                  >
                    {d.booking && getBookingItem(d.booking)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
        {/*{getItems()}*/}
        {/*<div className="item">This is an item</div>*/}
      </div>
      <pre>
        <div>Start : {defaultBeginDate.toDateString()}</div>
        <div>range : {range.startDate.toDateString()} {range.endDate.toDateString()}</div>
        <div>loadedPos : {loadedPos.date.toDateString()} {loadedPos.pos}</div>
        <div>ScrollPos : {scrollPos}</div>
        <div>Width : {visibleWidth}</div>
      </pre>
    </div>
  );
};
