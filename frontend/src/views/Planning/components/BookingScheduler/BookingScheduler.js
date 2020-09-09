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
import moment from "moment";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { startOfMonth } from "date-fns";
import { makeStyles } from "@material-ui/styles";
import { BookingQuickView, HtmlTooltip, Tooltip } from "components";
import { useTranslation } from "react-i18next";
import "./BookingScheduler.css";
import { Grid } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import purple from "@material-ui/core/colors/purple";

const useStyles = makeStyles(theme => ({
  root: {},
  collapseButton: {
    width: "100%",
    minWidth: "inherit",
    padding: "inherit",
    height: "fill-available"
  },
  navButton: {
    color: theme.palette.getContrastText(purple[500]),
    backgroundColor: purple[500],
    "&:hover": {
      backgroundColor: purple[700]
    }
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
  timelineHeader: {
    height: "30px"
  },
  dateHeader: {
    height: "10px"
  }
}));

const NavButton = (props) => {
  const {children, ...attr} = props;
  const classes = useStyles();
  return (
    <Button
      // className={classes.navButton}
      size="small"
      // variant="contained"
      color="primary"
      {...attr}
    >
      {children}
    </Button>
  );
};

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
    bookings, lodgings, beginDate, statuses,
    onOpenBooking, onCreateBooking, onItemSelected, onItemDeselected
  } = props;
  const classes = useStyles();
  const rootRef = useRef();
  const [horizontalMonths, setHorizontalMonths] = useState(1);
  const [visibleTime, setVisibleTime] = useState({
    start: moment(beginDate),
    end: moment(beginDate).add(horizontalMonths, "month")
  });
  const [collapsed, setCollapsed] = useState(false);
  const [selected, setSelected] = useState([]);
  const [width, height] = useWindowSize();
  const { t } = useTranslation();

  const updateLayout = (width, height) => {
    const nbMonths = width > 800 ? 2 : 1;
    if (nbMonths !== horizontalMonths) {
      console.debug("Changing nb months to " + nbMonths);
      setHorizontalMonths(nbMonths);
      setVisibleTime({
        start: moment(visibleTime.start),
        end: moment(visibleTime.start).add(nbMonths, "month")
      });
    }
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
  groups.push({
    id: -2,
    title: t("Holidays"),
    tip: t("Holidays"),
    stackItems: true,
    className: classes.specialGroup
    // height: 25
  });
  groups.push({
    id: -3,
    title: t("Cancellation / Waiting"),
    tip: t("Cancellation / Waiting"),
    stackItems: true,
    className: classes.specialGroup
    // height: 25
  });
  groups.push({
    id: -4,
    title: "",
    tip: "",
    stackItems: false,
    className: classes.groupSeparator,
    height: 10
  });
  groups.push({
    id: -5,
    title: t("Pricing"),
    tip: t("Pricing"),
    stackItems: true,
    className: classes.specialGroup
  });

  const items = bookings.map(booking => ({
    id: booking.id,
    group: booking.lodging_id > 0 ? booking.lodging_id : -3,
    title: booking.guest_name,
    status: booking.status,
    start_time: moment(booking.begin_date).add(12, "hours").valueOf(),
    end_time: moment(booking.end_date).add(6, "hours").valueOf(),
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
        color: "black"
      }
    },
    booking
  }));

  // bookings && console.debug(bookings[0]);
  // items && console.debug(items[0]);
  // console.debug(statuses);

  function getStatus(statusId) {
    return statuses.filter(s => s.id === statusId)[0];
  }

  function onViewChange(event) {
    console.debug("[onViewChange]");

  }

  function eventClicked(bookingId) {
    onOpenBooking && onOpenBooking(bookings.filter(b => b.id === bookingId)[0]);
  }

  function eventItemSelected(bookingId, e, time) {
    setSelected([bookingId])
    onItemSelected && onItemSelected(bookings.filter(b => b.id === bookingId)[0]);
  }

  function eventItemDeselected(bookingId) {
    setSelected(selected.filter((value, index, arr) => value === bookingId));
    onItemDeselected && onItemDeselected(bookings.filter(b => b.id === bookingId)[0]);
  }

  function onCanvasClick(groupId, time) {
    onCreateBooking && onCreateBooking(lodgings.filter(l => l.id === groupId)[0], new Date(time));
  }

  useLayoutEffect(() => {
    window.setTimeout(() => window.dispatchEvent(new Event("resize")));
  }, []);

  const onPrevNextClick = (months) => {
    setVisibleTime({
      start: moment(visibleTime.start).add(months, "month"),
      end: moment(visibleTime.end).add(months, "month")
    });
  };

  function renderTimeline(start, end) {
    return <Timeline
      groups={groups}
      items={items}
      // keys={keys}
      // defaultTimeStart={visibleTime.start}
      // defaultTimeEnd={visibleTime.end}
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
      lineHeight={20}
      stackItems
      itemTouchSendsClick
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
    </Timeline>;
  }

  var timelines = [];

  for (var i = 0; i < 12; i += horizontalMonths) {
    var start = moment(visibleTime.start).add(i, "month");
    timelines.push(
      <div key={i}>
        {renderTimeline(
          start.valueOf(),
          moment(start).add(horizontalMonths, "month").valueOf())}
      </div>
    );
  }

  return (
    <div className={classes.root} ref={rootRef}>
      <Grid container justify="space-between">
        <Grid item>
          <NavButton onClick={() => onPrevNextClick(-1)}>
            &lt;&lt; {visibleTime.start.add(-1, "month").format("MMMM YYYY")}
          </NavButton>
          <NavButton onClick={() => onPrevNextClick(-6)}>&lt;&lt; -{t("6 months")}</NavButton>
          <NavButton onClick={() => onPrevNextClick(-12)}>&lt;&lt; -{t("12 months")}</NavButton>
        </Grid>
        <Grid item>
          <NavButton onClick={() => onPrevNextClick(12)}>+{t("12 months")} &gt;&gt;</NavButton>
          <NavButton onClick={() => onPrevNextClick(6)}>+{t("6 months")} &gt;&gt;</NavButton>
          <NavButton onClick={() => onPrevNextClick(1)}>
            {visibleTime.start.add(1, "month").format("MMMM YYYY")} &gt;&gt;
          </NavButton>
        </Grid>
      </Grid>
      {timelines}
    </div>
  );

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

  function renderItem({
    item,
    itemContext,
    getItemProps,
    getResizeProps
  }) {
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
  statuses: PropTypes.array.isRequired
};

export default BookingScheduler;
