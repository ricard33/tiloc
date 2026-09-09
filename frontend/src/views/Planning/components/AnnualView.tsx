import React, { useLayoutEffect, useState } from "react";
import { add, startOfMonth, sub } from "date-fns";
import clsx from "clsx";
import useWindowDimensions from "../../../common/windowDimensions";
import { Booking, Lodging } from "../../../types";
import { PlanningSettings } from "./PlanningSettingsDialog";
import { TimelineView } from "./TimelineView";


type Props = {
  beginDate: Date,
  bookings: Booking[],
  disabled: boolean,
  lodgings: Lodging[],
  onCreateBooking?: (lodging: Lodging, startDate: Date) => void,
  settings: PlanningSettings,
};


const AnnualView: React.FC<Props> = props => {
  const {
    bookings, lodgings, beginDate: _beginDate,
    onCreateBooking,
    settings, disabled
  } = props;
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [horizontalMonths, setHorizontalMonths] = useState(1);
  const [lineHeight, setLineHeight] = useState(20);
  const [collapsedState, setCollapsed] = useState<boolean | undefined>(undefined);
  const collapsed = typeof collapsedState === "undefined" ? !isDesktop : collapsedState;

  const beginDate = _beginDate ?? startOfMonth(new Date());

  const updateLayout: (width: number, height: number) => void = (width /*height*/) => {
    const nbMonths = width > 1300 ? 2 : width > 700 ? 1 : 0.5;
    if (nbMonths !== horizontalMonths) {
      console.debug("Changing nb months to " + nbMonths);
      setHorizontalMonths(nbMonths);
    }
    const newLineHeight = nbMonths < 1 ? 40 : 24;
    if (newLineHeight !== lineHeight)
      setLineHeight(newLineHeight);
  };
  updateLayout(width, height);

  lodgings && lodgings.sort((a, b) => a.rank - b.rank);

  // bookings && console.debug(bookings[0]);
  // items && console.debug(items[0]);

  useLayoutEffect(() => {
    window.setTimeout(() => window.dispatchEvent(new Event("resize")));
  }, []);

   
  function renderTimeline(start: Date, end: Date) {
    return (
      <TimelineView
        bookings={bookings ?? []}
        lodgings={lodgings ?? []}
        visibleBeginDate={start}
        visibleEndDate={end}
        // goToDate={goToDate}
        onCreateBooking={onCreateBooking}
        // onScroll={onScroll}
        // onBoundsChange={onBoundsChange}
        settings={settings}
        dayHeight={lineHeight}
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      />
    );
  }

  const timelines = [];

  for (let i = 0; i < (settings.monthsToDisplay ?? 12); i += horizontalMonths) {
    const start = add(beginDate, { months: Math.trunc(i), days: 30 * (i % 1) });
    timelines.push(
      <div key={i} className="timeline">
        {renderTimeline(
          start,
          sub(add(start, horizontalMonths < 1 ? { days: 32 * horizontalMonths } : { months: horizontalMonths }), { days: 1 })
        )}
      </div>
    );
    // break;
  }

  return (
    <div className={clsx({ "booking-scheduler": true, disabled: disabled })}>
      {timelines}
    </div>
  );

};

export default AnnualView;
