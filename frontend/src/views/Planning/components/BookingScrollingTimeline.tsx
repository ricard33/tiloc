import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
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
import { useTranslation } from "react-i18next";
import "./BookingTimeline.scss";
import { shiftUTCDateToLocalDate } from "../../../common/tzUtils";
import clsx from "clsx";
import useWindowDimensions from "../../../common/windowDimensions";
import { Booking, Lodging } from "../../../types";
import { PlanningSettings } from "./PlanningSettingsDialog";
import { ZoomNavBar } from "./NavBar";
import {
  makeGroups,
  makeItems,
  makeRenderGroup,
  makeRenderItem,
  makeRenderSidebarHeader,
  timeSteps
} from "./TimelineCommon";


type Props = {
  beginDate: Date,
  endDate: Date,
  bookings: Booking[],
  disabled: boolean,
  lodgings: Lodging[],
  onCreateBooking?: (lodging: Lodging, startDate: Date) => void,
  onBoundsChange: (canvasTimeStart: number, canvasTimeEnd: number) => void,
  settings: PlanningSettings,
};

const BookingScrollingTimeline: React.FC<Props> = props => {
  const {
    bookings, lodgings, beginDate, endDate,
    onCreateBooking, onBoundsChange,
    settings, disabled
  } = props;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [collapsedState, setCollapsed] = useState<boolean | undefined>(undefined);
  const collapsed = typeof collapsedState === "undefined" ? !isDesktop : collapsedState;
  const { t } = useTranslation();
  const timelineRef = useRef<Timeline>(null);
  const [visibleDates, setVisibleDates] = useState({ start: beginDate.valueOf(), end: endDate.valueOf() });

  lodgings && lodgings.sort((a, b) => a.rank - b.rank);

  let groups = makeGroups(lodgings, t);
  const items = makeItems(bookings);


  // bookings && console.debug(bookings[0]);
  // items && console.debug(items[0]);

  function eventClicked(bookingId: number) {
    // onOpenBooking && onOpenBooking(bookings.filter(b => b.id === bookingId)[0]);
  }

  function onCanvasClick(groupId: number, time: number) {
    const localDate = shiftUTCDateToLocalDate(new Date(time));
    onCreateBooking && onCreateBooking(lodgings.filter(l => l.id === groupId)[0], localDate);
  }

  useLayoutEffect(() => {
    window.setTimeout(() => window.dispatchEvent(new Event("resize")));
  }, []);

  // eslint-disable-next-line react/no-multi-comp
  // var start = beginDate;
  // var end = add(beginDate, { months: horizontalMonths });
  const onZoom = (months: number) => {
    const oldZoom = visibleDates.end - visibleDates.start;
    const newZoom = months * 31 * 24 * 3600 * 1000;
    if (timelineRef.current)
      timelineRef.current.changeZoom(newZoom / oldZoom, 0);
  };

  const onTimeChange = useCallback((visibleTimeStart: number, visibleTimeEnd: number, updateScrollCanvas: (visibleTimeStart: number, visibleTimeEnd: number) => void, unit: string) => {
    updateScrollCanvas(visibleTimeStart, visibleTimeEnd);
    setVisibleDates({ start: visibleTimeStart, end: visibleTimeEnd });
  }, []);

  const renderSidebarHeader = makeRenderSidebarHeader(collapsed, setCollapsed);
  const renderItem = makeRenderItem(settings);
  const renderGroup = makeRenderGroup();

  return (
    <>
      <ZoomNavBar onChange={onZoom} />
      <div className={clsx({ "booking-timeline": true, disabled: disabled })}>
        <div className="timeline">
          <Timeline
            ref={timelineRef}
            groups={groups}
            items={items}
            // keys={keys}
            defaultTimeStart={beginDate}
            defaultTimeEnd={endDate}
            // visibleTimeStart={beginDate.valueOf()}
            // visibleTimeEnd={endDate.valueOf()}
            onItemClick={eventClicked}
            onCanvasClick={onCanvasClick}
            minZoom={14 * 86400 * 1000}
            canMove={false}
            canSelect={false}
            canChangeGroup={false}
            canResize={false}
            dragSnap={24 * 60 * 60 * 1000}
            lineHeight={50}
            stackItems
            clickTolerance={1}
            // itemTouchSendsClick
            // useResizeHandle
            timeSteps={timeSteps}
            sidebarWidth={collapsed ? 30 : 130}
            sidebarContent={<div>Above The Left</div>}
            groupRenderer={renderGroup}
            itemRenderer={renderItem}
            onBoundsChange={onBoundsChange}
            onTimeChange={onTimeChange}
          >
            <TimelineHeaders className={"sticky timeline-header"}>
              <SidebarHeader variant="left">
                {renderSidebarHeader}
              </SidebarHeader>
              <DateHeader unit="primaryHeader" />
              <DateHeader />
              {/*<DateHeader unit="month" className="date-header" />*/}
              {/*<DateHeader unit="day" className="date-header" />*/}
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
        </div>
      </div>
    </>
  );

};

export default BookingScrollingTimeline;
