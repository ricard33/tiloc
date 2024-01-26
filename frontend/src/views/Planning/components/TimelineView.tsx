import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Booking, BookingStatus, Lodging } from "../../../types";
import { PlanningSettings } from "./PlanningSettingsDialog";
import {
  add,
  differenceInCalendarDays,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getDaysInMonth, isLastDayOfMonth,
  isSameDay,
  isWeekend,
  isWithinInterval, max, min,
  startOfMonth,
  sub
} from "date-fns";
import { DateRange } from "../../../components/DateRangeSelector";
import "./TimelineView.scss";
import { formatISODate, getMonthName, getWeekdayName } from "../../../common/dateUtils";
import clsx from "clsx";
import { getBookingStatus, getIconAndBgColor } from "../../../common/statusUtils";
import { darken } from "@mui/system";
import EuroIcon from "@mui/icons-material/Euro";
import { useTranslation } from "react-i18next";
import BookingTooltip from "../../../components/BookingTooltip";
import { Button } from "@mui/material";
import useWindowDimensions from "../../../common/windowDimensions";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";

type Day = {
  date: Date,
  label: string,
  weekDay: string,
  isWeekend: boolean,
  isLastDayOfMonth: boolean;
  isToday: boolean,
  booking?: Booking,
  bookingOffset?: number,
  isBusy?: boolean,
  isSelected?: boolean,
  isSelectionStart?: boolean,
  isSelectionEnd?: boolean,
}

type Props = {
  defaultBeginDate?: Date,
  goToDate?: Date,    // special property: make an action on value change
  bookings: Booking[],
  disabled: boolean,
  lodgings: Lodging[],
  buffer?: number,
  onCreateBooking?: (lodging: Lodging, startDate: Date, endDate: Date) => void,
  onScroll?: (visibleStart: Date, visibleEnd: Date) => void,
  onBoundsChange: (canvasStart: Date, canvasEnd: Date) => void,
  settings: PlanningSettings,
};

export const TimelineView: React.FC<Props> = props => {
  const {
    defaultBeginDate, goToDate, bookings, lodgings, buffer,
    settings
  } = {
    defaultBeginDate: startOfMonth(new Date()),
    buffer: 9,
    ...props
  };
  const { t } = useTranslation();
  const dayWidth = 20;
  const dayHeight = 40;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const visibleWidth = dimensions.width;
  const [range, setRange] = useState({
    startDate: sub(startOfMonth(defaultBeginDate), { months: (buffer - 1) / 2 }),
    endDate: endOfMonth(add(defaultBeginDate, { months: (buffer - 1) / 2 }))
  });
  // console.log("range=", formatISODate(range.startDate), formatISODate(range.endDate));
  const [scrollPos, setScrollPos] = useState(differenceInDays(defaultBeginDate, range.startDate) * dayWidth);
  const [scrollPosUpdate, setScrollPosUpdate] = useState(scrollPos);
  const [loadedPos, setLoadedPos] = useState({ date: defaultBeginDate, pos: scrollPos });
  const [selectStart, setSelectStart] = useState<{ lodging: Lodging, date: Date } | undefined>(undefined);
  const [selectionEnd, setSelectionEnd] = useState<{ lodging: Lodging, date: Date } | undefined>(undefined);
  const { width: screenWidth } = useWindowDimensions();
  const isDesktop = screenWidth >= 900;
  const [collapsedState, setCollapsed] = useState<boolean | undefined>(undefined);
  const collapsed = typeof collapsedState === "undefined" ? !isDesktop : collapsedState;
  const ref = useRef<HTMLDivElement>(null);
  const heightStyle = {
    height: `${dayHeight}px`,
    minHeight: `${dayHeight}px`
  };
  const widthStyle = {
    width: `${dayWidth}px`,
    minWidth: `${dayWidth}px`,
    maxWidth: `${dayWidth}px`
  };
  const widthAndHeightStyle = {
    ...widthStyle,
    ...heightStyle
  };

  useEffect(() => {
    if (ref.current) {
      // console.log("Set scroll to ", scrollPosUpdate);
      ref.current.scrollLeft = scrollPosUpdate;
    }
  }, [scrollPosUpdate]);

  useEffect(() => {
    if (ref.current && goToDate) {
      console.info("Go to date  ", formatISODate(goToDate));
      // console.info("loaded date ", formatISODate(loadedPos.date));
      // console.info("Go to pos   ", differenceInCalendarDays(goToDate, loadedPos.date) * dayWidth);
      updateBounds({ startDate: goToDate, endDate: add(goToDate, { days: visibleWidth / dayWidth }) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToDate]);

  useEffect(() => {
    if (visibleWidth > 0) {
      // console.log("visibleWidth change -> updateBounds()");
      updateBounds({
        startDate: loadedPos.date,
        endDate: add(loadedPos.date, { days: visibleWidth / dayWidth })
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleWidth]);

  useLayoutEffect(() => {
    // console.log("useLayoutEffect");
    const measure = () => {
      if (ref.current) {
        setDimensions({ width: ref.current.offsetWidth, height: ref.current.offsetHeight });
      }
    };
    measure();
    window.addEventListener("resize", measure);

    return () => {
      window.removeEventListener("resize", measure);
    };
  }, []);

  const posToDate = (pos: number): Date => {
    return add(loadedPos.date, { days: (pos - loadedPos.pos) / dayWidth });
  };

  function updateBounds(visibleRange: { startDate: Date, endDate: Date }) {
    // console.log("updateBounds", formatISODate(visibleRange.startDate), formatISODate(visibleRange.endDate));
    const widthInDays = visibleWidth / dayWidth;
    const offsetInDays = widthInDays * (buffer - 1) / 2;
    // console.log(`widthInDays=${widthInDays}  offsetInDays=${offsetInDays}`);
    const newRange = {
      startDate: startOfMonth(sub(visibleRange.startDate, { days: offsetInDays })),
      endDate: endOfMonth(add(visibleRange.endDate, { days: offsetInDays }))
    };
    setRange(newRange);
    const newScrollPos = differenceInCalendarDays(visibleRange.startDate, newRange.startDate) * dayWidth;
    setLoadedPos({ date: visibleRange.startDate, pos: newScrollPos });
    setScrollPosUpdate(newScrollPos);

    props.onBoundsChange && props.onBoundsChange(
      newRange.startDate,
      newRange.endDate
    );
  }

  const limit = (buffer - 1) * visibleWidth / 2 / 2;

  function handleScroll(event: React.UIEvent<HTMLDivElement, UIEvent>) {
    const pos = event.currentTarget.scrollLeft;
    // console.log("handleScroll", pos);
    setScrollPos(pos);
    if (props.onScroll) props.onScroll(posToDate(pos), posToDate(pos + visibleWidth));
    // console.log("handleScroll", limit);
    if (pos < loadedPos.pos - limit || pos > loadedPos.pos + limit) {
      updateBounds({ startDate: posToDate(pos), endDate: posToDate(pos + visibleWidth) });
    }
  }

  function handleDayClick(lodging: Lodging, day: Day) {
    if (selectStart && selectStart.lodging.id === lodging.id) {
      if (!isSameDay(day.date, selectStart.date) && (!day.isBusy || day.booking)) {
        props.onCreateBooking && props.onCreateBooking(lodging, min([day.date, selectStart.date]), max([day.date, selectStart.date]));
      }
      setSelectStart(undefined);
    } else if (!day.isBusy) {
      setSelectStart({ date: day.date, lodging: lodging });
      setSelectionEnd({ date: day.date, lodging: lodging });
    }
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

  function getDays(range: DateRange, lodging?: Lodging): Day[] {
    const today = new Date();
    return eachDayOfInterval({ start: range.startDate, end: range.endDate }).map(d => {
      const start = selectStart && selectionEnd && min([selectStart.date, selectionEnd.date]);
      const end = selectStart && selectionEnd && max([selectStart.date, selectionEnd.date]);
      const isSelected = selectStart && lodging && lodging.id === selectStart.lodging.id
        && (isSameDay(selectStart.date, d)
          || (selectionEnd && isWithinInterval(d, {
            start: start!,
            end: end!
          }))
        );
      return {
        date: d,
        label: format(d, "dd"),
        weekDay: getWeekdayName(d),
        isWeekend: isWeekend(d),
        isLastDayOfMonth: isLastDayOfMonth(d),
        isToday: isSameDay(today, d),
        isSelected: isSelected,
        isSelectionStart: isSelected && isSameDay(d, start!),
        isSelectionEnd: isSelected && isSameDay(d, end!)
      };
    });
  }

  function getDaysWithBookings(lodging?: Lodging): Day[] {
    return getDays(range, lodging).map((day, index) => {
      const booking = bookings
        .find(b =>
          (
            lodging
              ? b.lodgings.find(l => l.id === lodging.id) && !b.cancelled
              : b.cancelled)
          && isWithinInterval(day.date, { start: b.begin_date, end: b.end_date })
        );
      const sameDay = booking && isSameDay(booking.begin_date, day.date);
      return {
        ...day,
        booking: (sameDay || index === 0) ? booking : undefined,
        bookingOffset: (booking && !sameDay && index === 0) ? differenceInCalendarDays(day.date, booking.begin_date) : undefined,
        isBusy: booking && !isSameDay(booking.end_date, day.date)
      };
    });
  }

  function getDayClasses(d: Day) {
    return {
      weekend: d.isWeekend,
      "end-of-month": d.isLastDayOfMonth,
      today: d.isToday,
      selected: d.isSelected,
      "selection-start": d.isSelectionStart,
      "selection-end": d.isSelectionEnd
    };
  }

  function renderBookingItem(booking: Booking, offsetInDays: number) {
    const statusProp = booking.status === BookingStatus.External.name
      ? getIconAndBgColor(booking)
      : {
        color: "black",
        bgColor: getBookingStatus(booking.status).color,
        selectedBgColor: darken(getBookingStatus(booking.status).color, 0.1)
      };

    const guest_name = settings.anonymized ? booking.guest_name.split(" ")[0] + " XXXXXX" : booking.guest_name;

    return (
      <BookingTooltip booking={booking}>
        <div
          className="item"
          title={guest_name}
          style={{
            width: (dayWidth * booking.duration - 0.1 * dayWidth) + "px",
            // color: "black",
            color: statusProp.color,
            backgroundColor: statusProp.bgColor,
            opacity: !booking.cancelled ? undefined : "50%",
            left: `${0.5 * dayWidth - offsetInDays * dayWidth}px`
          }}
        >
          {statusProp.icon ? statusProp.icon : ""}
          {booking.lodgings.length > 1 &&
            <AllInclusiveIcon
              fontSize="small"
              style={{
                height: "100%"
              }}
            />
          }
          <div className="item-title">{guest_name}</div>
          {booking.price && booking.price > 0 ?
            <EuroIcon
              className={clsx("item-icon", booking.left_to_pay > 0 ? "partially-paid" : "fully-paid")}
              style={{ height: `100%` }}
            /> : ""}
        </div>
      </BookingTooltip>
    );
  }

  return (
    <div className="timeline-view">
      <div className={clsx("table-responsive", { collapsed: collapsed })} onScroll={handleScroll} ref={ref}>
        <table className="table">
          <thead>
            <tr className="first-tr">
              <th className={clsx("lodging-name-col", { collapsed: collapsed })}>
                <Button
                  className="collapse-button" variant="outlined" fullWidth
                  onClick={() => setCollapsed(!collapsed)}
                >
                  {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </Button>
              </th>
              {getMonths(range).map((m) => {
                return <th key={m.date.valueOf()} colSpan={m.size}>
                  <div className="month">
                    <div className="month-label">{m.label}</div>
                  </div>
                </th>;
              })}
            </tr>
            <tr className="second-tr">
              <th className={clsx("lodging-name-col", { collapsed: collapsed })} />
              {getDays(range).map((d) =>
                <th
                  key={d.date.valueOf()} className={clsx("day", getDayClasses(d))}
                  style={widthStyle}
                >{d.label}</th>
              )}
            </tr>
            <tr className="third-tr">
              <th className={clsx("lodging-name-col", { collapsed: collapsed })} />
              {getDays(range).map((d) => {
                return (
                  <th
                    key={d.date.valueOf()} className={clsx("day", getDayClasses(d))}
                    style={widthStyle}
                  >{d.weekDay}</th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {lodgings.map(l =>
              <tr key={l.id}>
                <td className={clsx("lodging-name-col", { collapsed: collapsed })} style={heightStyle} title={l.name}>
                  <div className="lodging-name valign">{l.name}</div>
                </td>
                {getDaysWithBookings(l).map((d) => {
                  return (
                    <td
                      key={d.date.valueOf()}
                      className={clsx("day",
                        getDayClasses(d),
                        {
                          available: !d.isBusy,
                          busy: d.isBusy
                        })}
                      style={widthAndHeightStyle}
                      onClick={() => handleDayClick(l, d)}
                      onMouseEnter={() => selectStart && selectStart.lodging.id === l.id && setSelectionEnd({
                        date: d.date,
                        lodging: l
                      })}
                      onMouseLeave={() => selectionEnd && setSelectionEnd(selectStart)}
                    >
                      {settings.showPrices && !d.isBusy && <div className="day-price">{l.daily_rate} €</div>}
                      {d.booking && renderBookingItem(d.booking, d.bookingOffset ?? 0)}
                    </td>
                  );
                })}
              </tr>
            )}
            <tr key={-1}>
              <td
                className={clsx("lodging-name-col", "cancelled", { collapsed: collapsed })} style={heightStyle}
                title={t("Cancellation / Waiting")}
              >
                <div className="lodging-name valign">{t("Cancellation")}</div>
              </td>
              {getDaysWithBookings().map((d) => {
                return (
                  <td
                    key={d.date.valueOf()}
                    className={clsx("day", getDayClasses(d))}
                    style={widthAndHeightStyle}
                  >
                    {d.booking && renderBookingItem(d.booking, d.bookingOffset ?? 0)}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
      {/*<pre>*/}
      {/*  <div>Start     : {formatISODate(defaultBeginDate)}</div>*/}
      {/*  <div>goToDate  : {goToDate && formatISODate(goToDate)}</div>*/}
      {/*  <div>range     : {formatISODate(range.startDate)} {formatISODate(range.endDate)}</div>*/}
      {/*  <div>loadedPos : {formatISODate(loadedPos.date)} {loadedPos.pos}</div>*/}
      {/*  <div>limit     : {limit} left: {loadedPos.pos - limit} right: {loadedPos.pos + limit}</div>*/}
      {/*  <div>ScrollPos : {scrollPos}</div>*/}
      {/*  <div>Width     : {visibleWidth}</div>*/}
      {/*  <div>collapsed : {collapsed ? "true" : "false"}</div>*/}
      {/*</pre>*/}
    </div>
  );
};
