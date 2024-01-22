import React, { ReactElement } from "react";
import { Booking, BookingStatus, Lodging } from "../../../types";
import { TFunction } from "react-i18next";
import { add } from "date-fns";
import { getBookingStatus, getIconAndBgColor } from "../../../common/statusUtils";
import { darken } from "@mui/system";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import EuroIcon from "@mui/icons-material/Euro";
import clsx from "clsx";
import { Tooltip } from "../../../components";
import BookingTooltip from "../../../components/BookingTooltip";
import { PlanningSettings } from "./PlanningSettingsDialog";

export const timeSteps = {
  second: 0,
  minute: 0,
  hour: 0,
  day: 1,
  month: 1,
  year: 1
};

export type TimelineGroup = {
  id: number,
  title: string,
  rightTitle?: string,
  stackItems: boolean,
  tip: string,
  className: string,
  height?: number,
};

export type TimelineItem = {
  id: number|string,
  group: number,
  title: string,
  start_time: number,
  end_time: number,
  canMove: boolean,
  canResize: boolean,
  canChangeGroup: boolean,
  itemProps: React.HTMLAttributes<HTMLDivElement>,
  booking: Booking,
  color: string,
  bgColor: string,
  selectedBgColor?: string,
  icon?: ReactElement,
  linked?: boolean,
};

export type ItemContext = {
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

export type RenderItemProps = {
  item: TimelineItem,
  timelineContext: object,
  itemContext: ItemContext,
  getItemProps: (props: object) => React.HTMLAttributes<HTMLDivElement>,
  getResizeProps: (props?: object) => ResizeProps,
}

export type ResizeProps = {
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

export function makeGroups(lodgings: Lodging[], t: TFunction<"translation">) {
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
  return groups;
}


export function makeItems(bookings: Booking[]): TimelineItem[] {
  const bookingToItem = (booking: Booking, groupId: number) => ({
    id: booking.id! + "_" + groupId,
    group: groupId,
    title: booking.guest_name!,
    linked: booking.lodgings.length > 1,
    status: booking.status,
    start_time: add(booking.begin_date, { hours: 12 }).valueOf(),
    end_time: add(booking.end_date, { hours: 6 }).valueOf(),
    canMove: false,
    canResize: false,
    canChangeGroup: false,
    color: "black",
    ...(
      booking.status === BookingStatus.External.name
        ? getIconAndBgColor(booking)
        : {
          bgColor: getBookingStatus(booking.status).color,
          selectedBgColor: darken(getBookingStatus(booking.status).color, 0.1)
        }
    ),
    itemProps: {
      // these optional attributes are passed to the root <div /> of each item as <div {...itemProps} />
      // "data-custom-attribute": "Random content",
      "aria-hidden": true
      // onDoubleClick: () => {
      //   console.log("You clicked double!");
      // },
    },
    booking
  });
  let items: TimelineItem[] = [];
  if(bookings) {
    for (let i = 0; i < bookings.length; i++) {
      const booking = bookings[i];
      if (booking.cancelled) items.push(bookingToItem(booking, -3));
      else
        for (let j = 0; j < booking.lodgings.length; j++) {
          items.push(bookingToItem(booking, booking.lodgings[j].id));
        }
    }
  }
  return items;
}

// eslint-disable-next-line react/no-multi-comp,react/prop-types
export function makeRenderSidebarHeader(collapsed: boolean, setCollapsed: (v: boolean) => void) {
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

  return renderSidebarHeader;
}

export function makeRenderItem(
  settings: PlanningSettings) {

  function renderItem(props: RenderItemProps) {
    // /* eslint-disable react/prop-types */
    const { item, itemContext, getItemProps, getResizeProps } = props;
    const backgroundColor = itemContext.selected ? itemContext.dragging ? "red" : item.selectedBgColor : item.bgColor;
    const { title, ...itemProps } = getItemProps({
      ...item.itemProps,
      style: {
        color: item.color,
        background: backgroundColor,
        opacity: !item.booking.cancelled ? undefined : "50%",
        borderRadius: 4,
        borderLeftWidth: itemContext.selected ? 3 : 1,
        borderRightWidth: itemContext.selected ? 3 : 1
      }
    }); // remove the title props
    const { left: leftResizeProps, right: rightResizeProps } = getResizeProps();

    function Item() {
      return (
        <>
          <BookingTooltip booking={item.booking}>
            <div {...itemProps}>
              {itemContext.useResizeHandle ? <div {...leftResizeProps} /> : ""}

              <div
                className="rct-item-content item-content"
                style={{ maxHeight: `${itemContext.dimensions.height}` }}
              >
                {item.icon ? item.icon : ""}
                <div className="item-title">{item.linked && <span>{'\uD83D'}{'\uDD17'} </span>}{itemContext.title}</div>
                {settings.showPaymentStatus && item.booking.price && item.booking.price > 0 ?
                  <EuroIcon
                    className={clsx("item-icon", item.booking.left_to_pay > 0 ? "partially-paid" : "fully-paid")}
                    style={{ height: `${itemContext.dimensions.height - 2}` }}
                  /> : ""}
              </div>
              {itemContext.useResizeHandle ? <div {...rightResizeProps} /> : ""}
            </div>
          </BookingTooltip>
        </>
      );
    }

    return <Item />;
  }

  return renderItem;
}

export function makeRenderGroup() {
  function renderGroup({ group }: { group: TimelineGroup }) {
    return (
      <Tooltip title={group.tip}>
        <span className={group.className}>{group.title}</span>
      </Tooltip>
    );
  }

  return renderGroup;
}
