import React, { TouchEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Booking, BookingStatus, Lodging, paymentMethods } from "../../../types";
import { PlanningSettings } from "./PlanningSettingsDialog";
import {
  add,
  differenceInCalendarDays,
  differenceInDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  format,
  getDaysInMonth,
  isLastDayOfMonth,
  isSameDay,
  isWeekend,
  isWithinInterval,
  max,
  min,
  startOfMonth,
  sub
} from "date-fns";
import { DateRange } from "../../../components/DateRangeSelector";
import "./TimelineView.scss";
import { formatDate, formatISODate, getMonthName, getWeekdayName } from "../../../common/dateUtils";
import clsx from "clsx";
import { getBookingStatus, getIconAndBgColor } from "../../../common/statusUtils";
import { darken } from "@mui/system";
import EuroIcon from "@mui/icons-material/Euro";
import { useTranslation } from "react-i18next";
import BookingTooltip from "../../../components/BookingTooltip";
import { Button, Tooltip, tooltipClasses, TooltipProps } from "@mui/material";
import useWindowDimensions from "../../../common/windowDimensions";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import Grid2 from "@mui/material/Unstable_Grid2";
import { DecimalPrecision } from "../../../common/priceUtils";
import { styled } from "@mui/material/styles";


const PaymentsTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 375
  }
});


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
    settings, onScroll, onBoundsChange, onCreateBooking
  } = {
    defaultBeginDate: startOfMonth(new Date()),
    buffer: 5,
    ...props
  };
  const { t } = useTranslation();
  const dayWidth = 20;
  const dayHeight = 40;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const visibleWidth = dimensions.width;

  const getRangeToLoad = useCallback((startDate: Date) => {
    const widthInDays = visibleWidth / dayWidth;
    const offsetInDays = widthInDays * (buffer - 1) / 2;
    // console.log(`widthInDays=${widthInDays}  offsetInDays=${offsetInDays}`);
    return {
      startDate: startOfMonth(sub(startDate, { days: offsetInDays })),
      endDate: endOfMonth(add(startDate, { days: offsetInDays + widthInDays }))
    };

  }, [buffer, visibleWidth]);

  const [range, setRange] = useState(getRangeToLoad(defaultBeginDate));
  const previousStart = useRef<Date | undefined>(range.startDate);
  const scrollPos = useRef(differenceInDays(defaultBeginDate, range.startDate) * dayWidth);
  const oldPosRef = useRef(scrollPos.current);
  // const touchInProgress = useRef(false);
  const [touchInProgress, setTouchInProgress] = useState(false);
  // const nextScrollUpdate = useRef(false);
  const [nextScrollUpdate, setNextScrollUpdate] = useState(0);
  // const [scrollPos, setScrollPos] = useState(differenceInDays(defaultBeginDate, range.startDate) * dayWidth);
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

  const paymentLabels = paymentMethods(t).reduce<Record<string, string>>((obj, cur) => ({
    ...obj,
    [cur[0]]: cur[1]
  }), {});

  if (range.startDate !== previousStart.current) {
    if (ref.current) {
      const oldPos = ref.current.scrollLeft;
      // console.log("Old start", previousStart.current && formatISODate(previousStart.current));
      // console.log("New range", formatISODate(range.startDate), formatISODate(range.endDate));
      if (typeof previousStart.current !== "undefined") {
        const offset = differenceInDays(previousStart.current, range.startDate) * dayWidth;
        // console.log("New pos ", oldPos + offset, "(offset=", offset, ")");
        ref.current.scrollTo({ left: oldPos + offset });
        if (ref.current.scrollLeft !== oldPos + offset) {
          // First time, before days are rendered, scroll is not possible
          // console.log("Delay scrollPos");
          setTimeout(() => ref.current!.scrollTo({ left: oldPos + offset }), 0);
        }
        setNextScrollUpdate(oldPos + offset);
        oldPosRef.current = oldPos;

      } else if (goToDate) {
        ref.current.scrollTo({ left: differenceInDays(goToDate, range.startDate) * dayWidth });
        setTimeout(() => onScroll && onScroll(goToDate, add(goToDate, { days: visibleWidth / dayWidth })), 0);
      }
      previousStart.current = range.startDate;
    }
  }

  useEffect(() => {
    if (ref.current && goToDate) {
      console.info("Go to date  ", formatISODate(goToDate));
      updateBounds(goToDate);
      previousStart.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goToDate]);

  useEffect(() => {
    if (visibleWidth > 0) {
      // console.log("visibleWidth change -> updateBounds()");
      const visibleStartDate = add(range.startDate, { days: scrollPos.current / dayWidth });
      updateBounds(visibleStartDate);
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

  const updateBounds = useCallback((startDate: Date) => {
    // console.log("updateBounds", formatISODate(startDate));
    const newRange = getRangeToLoad(startDate);
    setRange(newRange);

    onBoundsChange && onBoundsChange(
      newRange.startDate,
      newRange.endDate
    );

  }, [getRangeToLoad, onBoundsChange]);

  // const limit = (buffer - 1) * visibleWidth / 2 / 2;
  const limit = visibleWidth / 2;
  const limitLeft = limit;
  const limitRight = ((buffer - 1) * visibleWidth) - limit;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement, UIEvent>) => {
    // console.log("handleScroll", event.currentTarget.scrollLeft, "nextScrollUpdate", nextScrollUpdate);
    const pos = event.currentTarget.scrollLeft;

    if (nextScrollUpdate && Math.abs(nextScrollUpdate - pos) > Math.abs(pos - oldPosRef.current)) {
      const shift = pos - oldPosRef.current;
      ref.current!.scrollTo({ left: nextScrollUpdate + shift });
      // console.log("skip scroll event, set scroll to ", nextScrollUpdate + shift);
      return;
    } else {
      setNextScrollUpdate(0);
    }

    const posToDate = (pos: number): Date => {
      return add(range.startDate, { days: pos / dayWidth });
    };

    // if (nextScrollUpdate) {
    //   if (ref.current!.scrollLeft === nextScrollUpdate)
    //     setNextScrollUpdate(0);
    //   else {
    //     ref.current!.scrollTo({ left: nextScrollUpdate });
    //     return;
    //   }
    // }

    if ((pos < limitLeft || pos > limitRight) && !touchInProgress) {
      // console.log(`POS => ${limitLeft} < ${pos} < ${limitRight}`);
      updateBounds(posToDate(pos));
    }

    // setScrollPos(pos);
    scrollPos.current = pos;
    if (onScroll) onScroll(posToDate(pos), posToDate(pos + visibleWidth));

  }, [limitLeft, limitRight, nextScrollUpdate, onScroll, range.startDate, touchInProgress, updateBounds, visibleWidth]);

  // const handleTouchMove = useCallback((event: TouchEvent<HTMLTableElement>) => {
  //   // console.log("handleTouchMove");
  //   // event.preventDefault();
  // }, []);

  const handleTouchEnd = useCallback((_: TouchEvent<HTMLTableElement>) => {
    // console.log("handleTouchEnd");
    setTouchInProgress(false);
  }, []);

  function handleDayClick(lodging: Lodging, day: Day) {
    if (selectStart && selectStart.lodging.id === lodging.id) {
      if (!isSameDay(day.date, selectStart.date) && (!day.isBusy || day.booking)) {
        onCreateBooking && onCreateBooking(lodging, min([day.date, selectStart.date]), max([day.date, selectStart.date]));
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
            <PaymentsTooltip
              title={booking.payments.length > 0 ? <Grid2 container width={375}>{booking.payments.map(p =>
                <React.Fragment key={p.id}>
                  <Grid2 xs={3}>{formatDate(p.date, "P")}</Grid2>
                  <Grid2 xs={3}>{p.description}</Grid2>
                  <Grid2 xs={3}>{paymentLabels[p.method]}</Grid2>
                  <Grid2 xs={3}>{DecimalPrecision.round(Number(p.amount))} &euro;</Grid2>
                </React.Fragment>)}</Grid2> : t("No payment")}
            >
              <EuroIcon
                className={clsx("item-icon", booking.left_to_pay > 0 ? "partially-paid" : "fully-paid")}
                style={{ height: `100%` }}
              />
            </PaymentsTooltip> : ""}
        </div>
      </BookingTooltip>
    );
  }

  return (
    <div className="timeline-view">
      <div className={clsx("table-responsive", { collapsed: collapsed })} onScroll={handleScroll} ref={ref}>
        <table
          className="table"
          onTouchStart={() => {
            setTouchInProgress(true);
          }}
          // onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
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
                  <div>
                    <div className="lodging-name valign">{l.name}</div>
                  </div>
                </td>
                {getDaysWithBookings(l).map((d, index) => {
                  // if ((index + 1) * dayWidth < scrollPos.current) {
                  //   if(index > 0)
                  //     return "";
                  //   return <td colSpan={Math.trunc((scrollPos.current - 1) / dayWidth)}/>;
                  // }
                  // if(index*dayWidth > visibleWidth+scrollPos.current) return "";
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
                <div>
                  <div className="lodging-name valign">{t("Cancellation")}</div>
                </div>
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
      {/*  <div>range px  : {0} {differenceInDays(range.endDate, range.startDate) * dayWidth}</div>*/}
      {/*  <div>ScrollPos : {limitLeft} &lt; {scrollPos.current} &lt; {limitRight}</div>*/}
      {/*  <div>Width     : {visibleWidth} ({visibleWidth / dayWidth} days)</div>*/}
      {/*  <div>Buffer    : {buffer}</div>*/}
      {/*  <div>touch?    : {touchInProgress ? "true" : "false"}</div>*/}
      {/*  <div>nextScroll: {nextScrollUpdate ?? "none"}</div>*/}
      {/*</pre>*/}
    </div>
  );
};
