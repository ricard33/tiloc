import React, { useState } from "react";
import PropTypes from "prop-types";
import Timeline, { DateHeader, SidebarHeader, TimelineHeaders } from "react-calendar-timeline";
import "react-calendar-timeline/lib/Timeline.css";
import moment from "moment";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { startOfMonth } from "date-fns";
import { makeStyles } from "@material-ui/styles";
import { Tooltip, HtmlTooltip, BookingQuickView } from "components";

const useStyles = makeStyles(theme => ({
  root: {},
  collapseButton: {
    width: "100%",
    minWidth: "inherit",
    padding: "inherit"
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  },
  lodging: {
    textOverflow: "ellipsis"
  }
}));


const keys = {
  groupIdKey: "id",
  groupTitleKey: "name",
  groupRightTitleKey: "rightTitle",
  groupLabelKey: "name",
  itemIdKey: "id",
  itemTitleKey: "guest_name",
  itemDivTitleKey: "guest_name"
  // itemGroupKey: "lodging_id",
  // itemTimeStartKey: "begin_date",
  // itemTimeEndKey: "end_date",
};

const timeSteps = {
  second: 0,
  minute: 0,
  hour: 0,
  day: 1,
  month: 1,
  year: 1
};

const BookingScheduler = props => {
  const {
    bookings, lodgings, beginDate, statuses,
    onOpenBooking, onCreateBooking
  } = props;
  const classes = useStyles();
  const groups = lodgings.map(lodging => ({
    id: lodging.id,
    title: lodging.name,
    rightTitle: "title in the right sidebar",
    stackItems: false,
    tip: lodging.name
    // height?: 30
  }));
  const [visibleTime, setVisibleTime] = useState({
    start: moment(beginDate),
    end: moment(beginDate).add(1, "month")
  });
  const [collapsed, setCollapsed] = useState(false);
  // console.log(visibleTime);
  const items = bookings.map(booking => ({
    id: booking.id,
    group: booking.lodging_id,
    title: booking.guest_name,
    status: booking.status,
    lodging: booking.lodging,
    start_time: moment(booking.begin_date).valueOf(),
    // startTime: moment().add(-5, "day").valueOf(),
    end_time: moment(booking.end_date).valueOf(),
    // endTime: moment().add(15, "day").valueOf(),
    canMove: true,
    canResize: true,
    canChangeGroup: true,
    itemProps: {
      // these optional attributes are passed to the root <div /> of each item as <div {...itemProps} />
      "data-custom-attribute": "Random content",
      "aria-hidden": true,
      onDoubleClick: () => {
        console.log("You clicked double!");
      },
      className: "weekend",
      style: {
        background: "#" + booking.status.color
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
    console.debug("[eventClicked]");
    onOpenBooking && onOpenBooking(bookings.filter(b => b.id === bookingId)[0]);
  }

  function onCanvasClick(groupId, time) {
    console.debug("[canvasClicked]");
    onCreateBooking && onCreateBooking(lodgings.filter(l => l.id === groupId)[0]);
  }

  window.setTimeout(() => window.dispatchEvent(new Event("resize")));

  return (
    <div className={classes.root}>
      <Timeline
        groups={groups}
        items={items}
        key={keys}
        defaultTimeStart={visibleTime.start}
        defaultTimeEnd={visibleTime.end}
        // onTimeChange={onTimeChange}
        onItemClick={eventClicked}
        onCanvasClick={onCanvasClick}
        minZoom={14 * 86400 * 1000}
        canResize={"both"}
        dragSnap={24 * 60 * 60 * 1000}
        // useResizeHandle
        timeSteps={timeSteps}
        sidebarWidth={collapsed ? 30 : 150}
        sidebarContent={<div>Above The Left</div>}
        groupRenderer={({ group }) => {
          return (
            <Tooltip title={group.tip}>
              <span className={classes.lodging}>{group.title}</span>
            </Tooltip>
          );
        }}
        itemRenderer={({
          item,
          itemContext,
          getItemProps,
          getResizeProps
        }) => {
          const { title, ...itemProps} = getItemProps(item.itemProps); // remove the title props
          const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();
          return (
            <HtmlTooltip title={<BookingQuickView booking={item.booking} />}>
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
        }}
      >
        <TimelineHeaders className="sticky">
          <SidebarHeader>
            {({ getRootProps }) => {
              return <div {...getRootProps()}>
                <button
                  className={classes.collapseButton}
                  onClick={() => {
                    setCollapsed(!collapsed);
                  }}
                >
                  {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                </button>
              </div>;
            }}
          </SidebarHeader>
          <DateHeader unit="primaryHeader"/>
          <DateHeader/>
        </TimelineHeaders>
      </Timeline>
    </div>
  );
};

BookingScheduler.defaultProps = {
  beginDate: startOfMonth(new Date())
};

BookingScheduler.propTypes = {
  beginDate: PropTypes.instanceOf(Date),
  bookings: PropTypes.array.isRequired,
  lodgings: PropTypes.array.isRequired,
  onCreateBooking: PropTypes.func,
  onOpenBooking: PropTypes.func,
  statuses: PropTypes.array.isRequired
};

export default BookingScheduler;
