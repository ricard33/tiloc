import React, { useState } from "react";
import { Badge, Drawer, IconButton, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import NotificationsIcon from "@mui/icons-material/NotificationsOutlined";
import CircleNotificationsIcon from "@mui/icons-material/CircleNotifications";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import CommentIcon from "@mui/icons-material/Comment";
import CheckIcon from "@mui/icons-material/Check";
import { useListNotificationsQuery, useReadNotificationMutation } from "../services/api";
import { Notification } from "../types";
import { useNavigate } from "react-router-dom";

const NotificationButton = () => {
  const { data: notifications, refetch } = useListNotificationsQuery({}, { pollingInterval: 10000 });
  const [markNotificationAsRead] = useReadNotificationMutation();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  function toggleDrawer(open: boolean) {
    return (event: React.KeyboardEvent | React.MouseEvent) => {
      if (
        event.type === "keydown" &&
        ((event as React.KeyboardEvent).key === "Tab" ||
          (event as React.KeyboardEvent).key === "Shift")
      ) {
        return;
      }

      setOpen(open);
    };
  }

  function handleNotificationClick(notification: Notification) {
    markNotificationAsRead(notification);
    refetch();
    if (notification.path)
      navigate(notification.path);
  }

  function markAsReadHandler(notification: Notification) {
    markNotificationAsRead(notification).then(() => {
      refetch();
    });
  }

  function getNotificationIcon(notification: Notification) {
    if (notification.notification.startsWith("booking-")) {
      return <CalendarIcon />;
    }
    else if (notification.notification.startsWith("comment-")) {
      return <CommentIcon />;
    }
    return <CircleNotificationsIcon />;
  }

  return (
    <React.Fragment>
      <IconButton color="inherit" size="large" onClick={toggleDrawer(!open)}>
        <Badge
          badgeContent={notifications ? notifications.filter((n) => n.read === false).length : 0}
          color="error"
          // variant="dot"
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Drawer
        anchor="right"
        open={open}
        onClose={toggleDrawer(false)}
      >
        <List style={{ paddingTop: "48px" }}>
          {notifications &&
            notifications.map((notification) =>
              <ListItem
                key={notification.id} disablePadding
                secondaryAction={
                  <IconButton
                    edge="end" aria-label="delete" color={notification.read ? "default" : "primary"}
                    onClick={() => markAsReadHandler(notification)}
                  >
                    <CheckIcon />
                  </IconButton>
                }
              >
                <ListItemButton onClick={() => handleNotificationClick(notification)}>
                  <ListItemIcon>{getNotificationIcon(notification)}</ListItemIcon>
                  <ListItemText>
                    <span
                      style={{ fontWeight: notification.read ? "normal" : "bold" }}
                    >{notification.description}</span>
                  </ListItemText>
                </ListItemButton>
              </ListItem>
            )
          }
        </List>
      </Drawer>
    </React.Fragment>
  );
};

export default NotificationButton;
