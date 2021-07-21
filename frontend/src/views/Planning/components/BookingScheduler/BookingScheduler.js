import React, { useState, useRef, useLayoutEffect } from "react";
import PropTypes from "prop-types";
import Timeline, {
  CursorMarker,
  DateHeader,
  SidebarHeader,
  TimelineHeaders,
  TimelineMarkers,
  TodayMarker
} from "react-calendar-timeline";
import "react-calendar-timeline/lib/Timeline.css";
import { add, parseISO } from "date-fns";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { startOfMonth } from "date-fns";
import { makeStyles } from "@material-ui/styles";
import { BookingQuickView, HtmlTooltip, Tooltip } from "components";
import { useTranslation } from "react-i18next";
import "./BookingScheduler.css";
import { shiftUTCDateToLocalDate } from "../../../../common/tzUtils";

const useStyles = makeStyles(theme => ({
  root: {},
  collapseButton: {
    width: "100%",
    minWidth: "inherit",
    padding: "inherit",
    height: "fill-available"
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  },
  lodging: {
    textOverflow: "ellipsis"
  },
  groupSeparator: {},
  specialGroup: {
    fontWeight: "bold"
  },
  timeline: {
    marginBottom: '10px',
  },
  timelineHeader: {
    height: "30px"
  },
  dateHeader: {
    height: "10px"
  }
}));

const timeSteps = {
  second: 0,
  minute: 0,
  hour: 0,
  day: 1,
  month: 1,
  year: 1
};

function debounce(fn, ms) {
  let timer;
  return (_) => {
    clearTimeout(timer);
    timer = setTimeout((_) => {
      timer = null;
      fn.apply(this, arguments);
    }, ms);
  };
}

function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useLayoutEffect(() => {
    console.debug("useLayoutEffect");

    const debouncedUpdateSize = debounce(function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }, 100);

    window.addEventListener("resize", debouncedUpdateSize);

    return () => window.removeEventListener("resize", debouncedUpdateSize);
  }, []);

  return size;
}

const BookingScheduler = props => {
  const {
    bookings, lodgings, beginDate,
    onOpenBooking, onCreateBooking, onItemSelected, onItemDeselected
  } = props;
  const classes = useStyles();
  const rootRef = useRef();
  const [horizontalMonths, setHorizontalMonths] = useState(1);
  const [lineHeight, setLineHeight] = useState(20);
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState([]);
  const [width, height] = useWindowSize();
  const { t } = useTranslation();

  const updateLayout = (width, height) => {
    const nbMonths = width > 1300 ? 2 : width > 700 ? 1 : 0.5;
    if (nbMonths !== horizontalMonths) {
      console.debug("Changing nb months to " + nbMonths);
      setHorizontalMonths(nbMonths);
    }
    const newLineHeight = nbMonths < 1 ? 30 : 20;
    if(newLineHeight !== lineHeight)
      setLineHeight(newLineHeight)
  };
  updateLayout(width, height);

  lodgings.sort((a, b) => a.rank - b.rank);
  let groups = lodgings.map(lodging => ({
    id: lodging.id,
    title: lodging.name,
    // rightTitle: "title in the right sidebar",
    stackItems: true,
    tip: lodging.name,
    className: classes.lodging
    // height?: 30
  }));

  groups.push({
    id: -1,
    title: "",
    tip: "",
    stackItems: false,
    className: classes.groupSeparator,
    height: 10
  });
  // groups.push({
  //   id: -2,
  //   title: t("Holidays"),
  //   tip: t("Holidays"),
  //   stackItems: true,
  //   className: classes.specialGroup
  //   // height: 25
  // });
  groups.push({
    id: -3,
    title: t("Cancellation / Waiting"),
    tip: t("Cancellation / Waiting"),
    stackItems: true,
    className: classes.specialGroup
    // height: 25
  });
  // groups.push({
  //   id: -4,
  //   title: "",
  //   tip: "",
  //   stackItems: false,
  //   className: classes.groupSeparator,
  //   height: 10
  // });
  // groups.push({
  //   id: -5,
  //   title: t("Pricing"),
  //   tip: t("Pricing"),
  //   stackItems: true,
  //   className: classes.specialGroup
  // });

  const items = bookings.map(booking => ({
    id: booking.id,
    group: booking.lodging_id > 0 ? booking.lodging_id : -3,
    title: booking.guest_name,
    status: booking.status,
    start_time: add(parseISO(booking.begin_date), { hours: 12 }).valueOf(),
    end_time: add(parseISO(booking.end_date), { hours: 6 }).valueOf(),
    canMove: false,
    canResize: false,
    canChangeGroup: false,
    itemProps: {
      // these optional attributes are passed to the root <div /> of each item as <div {...itemProps} />
      "data-custom-attribute": "Random content",
      "aria-hidden": true,
      onDoubleClick: () => {
        console.log("You clicked double!");
      },
      style: {
        background: "#" + booking.status.color,
        color: "black",
        opacity: booking.lodging_id > 0 ? undefined : '50%'
      }
    },
    booking
  }));

  // bookings && console.debug(bookings[0]);
  // items && console.debug(items[0]);

  function eventClicked(bookingId) {
    onOpenBooking && onOpenBooking(bookings.filter(b => b.id === bookingId)[0]);
  }

  function eventItemSelected(bookingId, e, time) {
    setSelected([bookingId]);
    onItemSelected && onItemSelected(bookings.filter(b => b.id === bookingId)[0]);
  }

  function eventItemDeselected(bookingId) {
    setSelected(selected.filter((value, index, arr) => value === bookingId));
    onItemDeselected && onItemDeselected(bookings.filter(b => b.id === bookingId)[0]);
  }

  function onCanvasClick(groupId, time) {
    const localDate = shiftUTCDateToLocalDate(new Date(time));
    onCreateBooking && onCreateBooking(lodgings.filter(l => l.id === groupId)[0], localDate);
  }

  useLayoutEffect(() => {
    window.setTimeout(() => window.dispatchEvent(new Event("resize")));
  }, []);

  // eslint-disable-next-line react/no-multi-comp
  function renderTimeline(start, end) {
    return (
      <Timeline
        groups={groups}
        items={items}
        // keys={keys}
        visibleTimeStart={start}
        visibleTimeEnd={end}
        onItemClick={eventClicked}
        selected={selected}
        onItemSelect={eventItemSelected}
        onItemDeselect={eventItemDeselected}
        onCanvasClick={onCanvasClick}
        minZoom={14 * 86400 * 1000}
        canMove={false}
        canChangeGroup={false}
        canResize={false}
        dragSnap={24 * 60 * 60 * 1000}
        lineHeight={lineHeight}
        stackItems
        clickTolerance={1}
        // itemTouchSendsClick
        // useResizeHandle
        timeSteps={timeSteps}
        sidebarWidth={collapsed ? 30 : 130}
        sidebarContent={<div>Above The Left</div>}
        groupRenderer={renderGroup}
        itemRenderer={renderItem}
      >
        <TimelineHeaders className={"sticky " + classes.timelineHeader}>
          <SidebarHeader>
            {renderSidebarHeader}
          </SidebarHeader>
          <DateHeader unit="month" className={classes.dateHeader} height={15}/>
          <DateHeader unit="day" className={classes.dateHeader} height={15}/>
        </TimelineHeaders>
        <TimelineMarkers>
          <TodayMarker>
            {({ styles, date }) =>
              <div style={{ ...styles, backgroundColor: "red" }}/>
            }
          </TodayMarker>
          <CursorMarker/>
        </TimelineMarkers>
      </Timeline>
    );
  }

  var timelines = [];

  for (var i = 0; i < 12; i += horizontalMonths) {
    var start = add(beginDate, { months: Math.trunc(i), days: 30 * (i % 1) });
    timelines.push(
      <div key={i} className={classes.timeline}>
        {renderTimeline(
          start.valueOf(),
          add(start, horizontalMonths < 1 ? { days: 32 * horizontalMonths} : { months: horizontalMonths }).valueOf())}
      </div>
    );
  }

  return (
    <div className={classes.root} ref={rootRef}>
      {/*<Grid container justifyContent="space-between">*/}
      {/*  <Grid item>*/}
      {/*    <NavButton onClick={() => onPrevNextClick(-1)}>*/}
      {/*      &lt;&lt; {visibleTime.start.add(-1, "month").format("MMMM YYYY")}*/}
      {/*    </NavButton>*/}
      {/*    <NavButton onClick={() => onPrevNextClick(-6)}>&lt;&lt; -{t("6 months")}</NavButton>*/}
      {/*    <NavButton onClick={() => onPrevNextClick(-12)}>&lt;&lt; -{t("12 months")}</NavButton>*/}
      {/*  </Grid>*/}
      {/*  <Grid item>*/}
      {/*    <NavButton onClick={() => onPrevNextClick(12)}>+{t("12 months")} &gt;&gt;</NavButton>*/}
      {/*    <NavButton onClick={() => onPrevNextClick(6)}>+{t("6 months")} &gt;&gt;</NavButton>*/}
      {/*    <NavButton onClick={() => onPrevNextClick(1)}>*/}
      {/*      {visibleTime.start.add(1, "month").format("MMMM YYYY")} &gt;&gt;*/}
      {/*    </NavButton>*/}
      {/*  </Grid>*/}
      {/*</Grid>*/}
      {timelines}
    </div>
  );

  // eslint-disable-next-line react/no-multi-comp,react/prop-types
  function renderSidebarHeader({ getRootProps }) {
    return <div {...getRootProps()}>
      <button
        className={classes.collapseButton}
        onClick={() => {
          setCollapsed(!collapsed);
          window.setTimeout(() => window.dispatchEvent(new Event("resize")));
        }}
      >
        {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
      </button>
    </div>;
  }

  // eslint-disable-next-line react/no-multi-comp
  function renderItem(props) {
    /* eslint-disable react/prop-types */
    const { item, itemContext, getItemProps, getResizeProps } = props;
    const { title, ...itemProps } = getItemProps(item.itemProps); // remove the title props
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
    return (
      <HtmlTooltip title={<BookingQuickView booking={item.booking}/>}>
        <div {...itemProps}>
          {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : ""}

          <div
            className="rct-item-content"
            style={{ maxHeight: `${itemContext.dimensions.height}` }}
          >
            {itemContext.title}
          </div>
          {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : ""}
        </div>
      </HtmlTooltip>
    );
  }

  // eslint-disable-next-line react/no-multi-comp
  function renderGroup({ group }) {
    return (
      <Tooltip title={group.tip}>
        <span className={group.className}>{group.title}</span>
      </Tooltip>
    );
  }


};

BookingScheduler.defaultProps = {
  beginDate: startOfMonth(new Date())
};

BookingScheduler.propTypes = {
  beginDate: PropTypes.instanceOf(Date),
  bookings: PropTypes.array.isRequired,
  lodgings: PropTypes.array.isRequired,
  onCreateBooking: PropTypes.func,
  onItemDeselected: PropTypes.func,
  onItemSelected: PropTypes.func,
  onOpenBooking: PropTypes.func,
};

export default BookingScheduler;
