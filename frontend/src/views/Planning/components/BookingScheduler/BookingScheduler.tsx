import React, { useLayoutEffect, useState } from "react";
import Timeline, {
  CursorMarker,
  DateHeader,
  SidebarHeader,
  TimelineHeaders,
  TimelineMarkers,
  TodayMarker
// @ts-ignore
} from "@ti-gecko/react-calendar-timeline";
import "@ti-gecko/react-calendar-timeline/lib/Timeline.css";
import { add, startOfMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import "./BookingScheduler.scss";
import { shiftUTCDateToLocalDate } from "../../../../common/tzUtils";
import clsx from "clsx";
import useWindowDimensions from "../../../../common/windowDimensions";
import { Booking, Lodging } from "../../../../types";
import {
  makeGroups,
  makeItems,
  makeRenderGroup,
  makeRenderItem,
  makeRenderSidebarHeader,
  timeSteps
} from "../TimelineCommon";
import { PlanningSettings } from "../PlanningSettingsDialog";


type Props = {
  beginDate: Date,
  bookings: Booking[],
  disabled: boolean,
  lodgings: Lodging[],
  onCreateBooking?: (lodging: Lodging, startDate: Date) => void,
  onOpenBooking: (booking: Booking) => void,
  onEditBooking?: (booking: Booking) => void,
  onCancelBooking?: (booking: Booking) => void,
  settings: PlanningSettings,
};


// TODO rename to BookingFixedTimeline
const BookingScheduler: React.FC<Props> = props => {
  const {
    bookings, lodgings, beginDate: _beginDate,
    onOpenBooking, onEditBooking, onCancelBooking, onCreateBooking,
    settings, disabled
  } = props;
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [horizontalMonths, setHorizontalMonths] = useState(1);
  const [lineHeight, setLineHeight] = useState(20);
  const [collapsedState, setCollapsed] = useState<boolean | undefined>(undefined);
  const collapsed = typeof collapsedState === "undefined" ? !isDesktop : collapsedState;
  const { t } = useTranslation();

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

  let groups = makeGroups(lodgings, t);
  const items = makeItems(bookings);

  // bookings && console.debug(bookings[0]);
  // items && console.debug(items[0]);

  function eventClicked(bookingId: number) {
    console.log("onItemClick");
    // let item = items.filter(item => item.id === bookingId)[0];
    // item.title += "x";
    // onOpenBooking && onOpenBooking(bookings.filter(b => b.id === bookingId)[0]);
  }

  function onCanvasClick(groupId: number, time: number) {
    const localDate = shiftUTCDateToLocalDate(new Date(time));
    onCreateBooking && onCreateBooking(lodgings.filter(l => l.id === groupId)[0], localDate);
  }

  useLayoutEffect(() => {
    window.setTimeout(() => window.dispatchEvent(new Event("resize")));
  }, []);

  const renderSidebarHeader = makeRenderSidebarHeader(collapsed, setCollapsed);
  const renderItem = makeRenderItem({ onOpenBooking, onEditBooking, onCancelBooking }, settings);
  const renderGroup = makeRenderGroup();

  // eslint-disable-next-line react/no-multi-comp
  function renderTimeline(start: number, end: number) {
    return (
      <Timeline
        groups={groups}
        items={items}
        // keys={keys}
        visibleTimeStart={start}
        visibleTimeEnd={end}
        onItemClick={eventClicked}
        onCanvasClick={onCanvasClick}
        minZoom={14 * 86400 * 1000}
        canMove={false}
        canSelect={false}
        canChangeGroup={false}
        canResize={false}
        dragSnap={24 * 60 * 60 * 1000}
        lineHeight={lineHeight}
        stackItems
        clickTolerance={30}
        // itemTouchSendsClick
        // useResizeHandle
        timeSteps={timeSteps}
        sidebarWidth={collapsed ? 30 : 130}
        sidebarContent={<div>Above The Left</div>}
        groupRenderer={renderGroup}
        itemRenderer={renderItem}
      >
        <TimelineHeaders className={"sticky timeline-header"} calendarHeaderClassName={"calendar-header"}>
          <SidebarHeader variant="left" headerData={{}}>
            {renderSidebarHeader}
          </SidebarHeader>
          <DateHeader unit="month" className="date-header" height={15}  />
          <DateHeader unit="day" className="date-header" height={15} />
        </TimelineHeaders>
        <TimelineMarkers>
          <TodayMarker>
            {({ styles }: { styles: object, date: number }) =>
              <div style={{ ...styles, backgroundColor: "red" }} />
            }
          </TodayMarker>
          <CursorMarker />
        </TimelineMarkers>
      </Timeline>
    );
  }

  let timelines = [];

  for (let i = 0; i < (settings.monthsToDisplay ?? 12); i += horizontalMonths) {
    let start = add(beginDate, { months: Math.trunc(i), days: 30 * (i % 1) });
    timelines.push(
      <div key={i} className="timeline">
        {renderTimeline(
          start.valueOf(),
          add(start, horizontalMonths < 1 ? { days: 32 * horizontalMonths } : { months: horizontalMonths }).valueOf())}
      </div>
    );
  }

  return (
    <div className={clsx({ "booking-scheduler": true, disabled: disabled })}>
      {timelines}
    </div>
  );

};

export default BookingScheduler;
