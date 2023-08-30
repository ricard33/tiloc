import React, { useState, useLayoutEffect, useRef, useCallback } from "react";
import Timeline, {
  CursorMarker, DateHeader, SidebarHeader, TimelineHeaders,
  TimelineMarkers,
  TodayMarker
} from "@ti-gecko/react-calendar-timeline";
import "@ti-gecko/react-calendar-timeline/lib/Timeline.css";
import { add } from "date-fns";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import EuroIcon from "@mui/icons-material/Euro";
import { BookingQuickView, HtmlTooltip, Tooltip } from "../../../components";
import { useTranslation } from "react-i18next";
import "./BookingTimeline.scss";
import { shiftUTCDateToLocalDate } from "../../../common/tzUtils";
import clsx from "clsx";
import useWindowDimensions from "../../../common/windowDimensions";
import { Booking, Lodging } from "../../../types";
import { PlanningSettings } from "./PlanningSettingsDialog";
import BookingTooltip from "./BookingTooltip";
import { ZoomNavBar } from "./NavBar";

const timeSteps = {
  second: 0,
  minute: 0,
  hour: 0,
  day: 1,
  month: 1,
  year: 1
};

type TimelineGroup = {
  id: number,
  title: string,
  rightTitle?: string,
  stackItems: boolean,
  tip: string,
  className: string,
  height?: number,
};

type TimelineItem = {
  id: number,
  group: number,
  title: string,
  start_time: number,
  end_time: number,
  canMove: boolean,
  canResize: boolean,
  canChangeGroup: boolean,
  itemProps: React.HTMLAttributes<HTMLDivElement>,
  booking: Booking,
};

type ItemContext = {
  dimensions: {
    collisionLeft: number,
    collisionWidth: number,
    height: number,
    isDragging: boolean,
    left: number,
    order: number,
    originalLeft: number,
    stack: number,
    top: number,
    width: number
  },
  useResizeHandle: boolean,
  title: string,
  canMove: boolean,
  canResizeLeft: boolean,
  canResizeRight: boolean,
  selected: boolean,
  dragging: boolean,
  dragStart: { x: number, y: number },
  dragTime: number,
  dragGroupDelta: number,
  resizing: boolean,
  resizeEdge: { left: number, right: number },
  resizeStart: number,
  resizeTime: number,
  width: number,
};

type RenderItemProps = {
  item: TimelineItem,
  timelineContext: object,
  itemContext: ItemContext,
  getItemProps: (props: object) => React.HTMLAttributes<HTMLDivElement>,
  getResizeProps: (props?: object) => ResizeProps,
}

type ResizeProps = {
  left: {
    ref: any,
    className: string,
    style: object
  },
  right: {
    ref: any,
    className: string,
    style: object
  }
}

type Props = {
  beginDate: Date,
  endDate: Date,
  bookings: Booking[],
  disabled: boolean,
  lodgings: Lodging[],
  onCreateBooking?: (lodging: Lodging, startDate: Date) => void,
  onItemDeselected: (booking: Booking) => void,
  onItemSelected: (booking: Booking) => void,
  onOpenBooking: (booking: Booking) => void,
  onBoundsChange: (canvasTimeStart: number, canvasTimeEnd: number) => void,
  settings: PlanningSettings,
};


const BookingTimeline: React.FC<Props> = props => {
  const {
    bookings, lodgings, beginDate, endDate,
    onOpenBooking, onCreateBooking, onItemSelected, onItemDeselected, onBoundsChange,
    settings, disabled
  } = props;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const [collapsedState, setCollapsed] = useState<boolean | undefined>(undefined);
  const collapsed = typeof collapsedState === "undefined" ? !isDesktop : collapsedState;
  const [selected, setSelected] = useState<number[]>([]);
  const { t } = useTranslation();
  const timelineRef = useRef<Timeline>(null);
  const [visibleDates, setVisibleDates] = useState({ start: beginDate.valueOf(), end: endDate.valueOf() });

  lodgings && lodgings.sort((a, b) => a.rank - b.rank);
  let groups: TimelineGroup[] = lodgings.map(lodging => ({
    id: lodging.id,
    title: lodging.name,
    // rightTitle: "title in the right sidebar",
    stackItems: true,
    tip: lodging.name,
    className: "lodging"
    // height?: 30
  }));

  groups.push({
    id: -1,
    title: "",
    tip: "",
    stackItems: false,
    className: "group-separator",
    height: 10
  });
  // groups.push({
  //   id: -2,
  //   title: t("Holidays"),
  //   tip: t("Holidays"),
  //   stackItems: true,
  //   className: 'special-group'
  //   // height: 25
  // });
  groups.push({
    id: -3,
    title: t("Cancellation / Waiting"),
    tip: t("Cancellation / Waiting"),
    stackItems: true,
    className: "special-group"
    // height: 25
  });
  // groups.push({
  //   id: -4,
  //   title: "",
  //   tip: "",
  //   stackItems: false,
  //   className: 'group-separator',
  //   height: 10
  // });
  // groups.push({
  //   id: -5,
  //   title: t("Pricing"),
  //   tip: t("Pricing"),
  //   stackItems: true,
  //   className: 'special-group'
  // });

  const items = (bookings ?? []).map(booking => ({
    id: booking.id,
    group: !booking.cancelled ? booking.lodging_id : -3,
    title: booking.guest_name,
    status: booking.status,
    start_time: add(booking.begin_date, { hours: 12 }).valueOf(),
    end_time: add(booking.end_date, { hours: 6 }).valueOf(),
    canMove: false,
    canResize: false,
    canChangeGroup: false,
    itemProps: {
      // these optional attributes are passed to the root <div /> of each item as <div {...itemProps} />
      // "data-custom-attribute": "Random content",
      "aria-hidden": true,
      // onDoubleClick: () => {
      //   console.log("You clicked double!");
      // },
      style: {
        background: booking.status.color,
        color: "black",
        opacity: booking.lodging_id > 0 && !booking.cancelled ? undefined : "50%"
      }
    },
    booking
  }));

  // bookings && console.debug(bookings[0]);
  // items && console.debug(items[0]);

  function eventClicked(bookingId: number) {
    onOpenBooking && onOpenBooking(bookings.filter(b => b.id === bookingId)[0]);
  }

  function eventItemSelected(bookingId: number) {
    setSelected([bookingId]);
    onItemSelected && onItemSelected(bookings.filter(b => b.id === bookingId)[0]);
    // onOpenBooking && onOpenBooking(bookings.filter(b => b.id === bookingId)[0]);
  }

  function eventItemDeselected(bookingId: number) {
    setSelected(selected.filter((value /*index, arr*/) => value === bookingId));
    onItemDeselected && onItemDeselected(bookings.filter(b => b.id === bookingId)[0]);
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
            selected={selected}
            onItemSelect={eventItemSelected}
            onItemDeselect={eventItemDeselected}
            onCanvasClick={onCanvasClick}
            minZoom={14 * 86400 * 1000}
            canMove={false}
            // canSelect={false}
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

  // eslint-disable-next-line react/no-multi-comp,react/prop-types
  function renderSidebarHeader({ getRootProps }: { getRootProps: () => object }) {
    return <div {...getRootProps()}>
      <button
        className="collapse-button"
        onClick={() => {
          setCollapsed(!collapsed);
          window.setTimeout(() => window.dispatchEvent(new Event("resize")));
        }}
      >
        {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>
    </div>;
  }

  // eslint-disable-next-line react/no-multi-comp
  function renderItem(props: RenderItemProps) {
    /* eslint-disable react/prop-types */
    const { item, itemContext, getItemProps, getResizeProps } = props;
    const { title, ...itemProps } = getItemProps(item.itemProps); // remove the title props
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();

    function getItem() {
      return <div {...itemProps}>
        {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : ""}

        <div
          className="rct-item-content item-content"
          style={{ maxHeight: `${itemContext.dimensions.height}` }}
        >
          <div className="item-title">{itemContext.title}</div>
          {settings.showPaymentStatus && item.booking.price && item.booking.price > 0 &&
            <EuroIcon
              className={clsx("item-icon", item.booking.left_to_pay > 0 ? "partially-paid" : "fully-paid")}
              style={{ height: `${itemContext.dimensions.height - 2}` }}
            />}
        </div>
        {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : ""}
      </div>;
    }

    if (settings.showTooltips)
      return (
        settings.smallTooltips
          ? <HtmlTooltip title={<BookingTooltip booking={item.booking} onOpenBooking={onOpenBooking} />} arrow>
            {getItem()}
          </HtmlTooltip>
          :
          <HtmlTooltip
            title={<BookingQuickView booking={item.booking} readonly />} enterDelay={500}
            arrow
          >
            {getItem()}
          </HtmlTooltip>
      );
    else return getItem();
  }

  // eslint-disable-next-line react/no-multi-comp
  function renderGroup({ group }: { group: TimelineGroup }) {
    return (
      <Tooltip title={group.tip}>
        <span className={group.className}>{group.title}</span>
      </Tooltip>
    );
  }
};

export default BookingTimeline;
