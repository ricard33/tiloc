import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Timeline, { DateHeader, SidebarHeader, TimelineHeaders } from "react-calendar-timeline";
import "react-calendar-timeline/lib/Timeline.css";
import moment from "moment";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import { startOfMonth } from "date-fns";
import { format, parseISO, addDays, differenceInCalendarDays } from "date-fns";
import { makeStyles } from "@material-ui/styles";
import { Tooltip } from "components";

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
  const { bookings, lodgings, beginDate, statuses } = props;
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
  console.log(visibleTime);
  const items = bookings.map(booking => ({
    id: booking.id,
    group: booking.lodging,
    title: booking.guest_name,
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
        background: "#" + getStatus(booking.status_id).color
      }
    }
  }));

  items && console.debug(items[0]);
  console.debug(statuses);

  function getStatus(statusId) {
    const r = statuses.filter(s => s.id === statusId)[0];
    return r;
    // return {color: "red"}
  }

  function prevClick(event) {
    console.debug("[prevClick]");

  }

  function nextClick(event) {
    console.debug("[nextClick]");

  }

  function onSelectDate(event) {
    console.debug("[onSelectDate]");

  }

  function onViewChange(event) {
    console.debug("[onViewChange]");

  }

  function eventClicked(event) {
    console.debug("[eventClicked]");
  }

  window.setTimeout(() => window.dispatchEvent(new Event("resize")));

  const collapseButton = () => (
    <button
      onClick={() => {
        setCollapsed(!collapsed);
      }}
    >
      {collapsed ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
    </button>
  );

  return (
    <div className={classes.root}>
      <Timeline
        groups={groups}
        items={items}
        key={keys}
        defaultTimeStart={visibleTime.start}
        defaultTimeEnd={visibleTime.end}
        // onTimeChange={onTimeChange}
        minZoom={14 * 86400 * 1000}
        canResize={"both"}
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
  statuses: PropTypes.array.isRequired
};

export default BookingScheduler;
