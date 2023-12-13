import React, { useState } from "react";
import {
  Badge,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack, Typography
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/NotificationsOutlined";
import CircleNotificationsIcon from "@mui/icons-material/CircleNotifications";
import CalendarIcon from "@mui/icons-material/CalendarToday";
import CommentIcon from "@mui/icons-material/Comment";
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CircleIcon from "@mui/icons-material/Circle";
import {
  useListNotificationsQuery,
  useReadAllNotificationsMutation,
  useReadNotificationMutation
} from "../services/api";
import { Notification } from "../types";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDistanceToNow } from "../common/dateUtils";

const NotificationButton = () => {
  const { t } = useTranslation();
  const { data: notifications, refetch } = useListNotificationsQuery({}, { pollingInterval: 30000 });
  const [markNotificationAsRead] = useReadNotificationMutation();
  const [markAllNotificationsAsRead] = useReadAllNotificationsMutation();
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
    markNotificationAsRead(notification).then(() => {
      refetch();
    });
    setOpen(false);
    if (notification.path)
      navigate(notification.path);
  }

  function markAsReadHandler(notification: Notification) {
    markNotificationAsRead(notification).then(() => {
      refetch();
    });
  }

  function markAllAsReadHandler() {
    markAllNotificationsAsRead().then(() => {
      refetch();
    });
  }

  function getNotificationIcon(notification: Notification) {
    if (notification.notification.startsWith("booking-")) {
      return <CalendarIcon />;
    } else if (notification.notification.startsWith("comment-")) {
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
        <Stack direction={"column"} maxWidth={360} style={{ paddingTop: "48px" }}>
          <Stack direction={"row"} style={{margin: "10px"}} justifyContent={"space-between"}>
            <Typography variant="h5">{t("Notifications")}</Typography>
            <IconButton
              edge="end" aria-label="mark_all_read" color="primary"
              title={t("Mark all notifications read")}
              onClick={() => markAllAsReadHandler()}
            >
              <DoneAllIcon />
            </IconButton>
          </Stack>
          <List>
            {notifications &&
              notifications.map((notification) =>
                <ListItem
                  key={notification.id} disablePadding
                  alignItems="flex-start"
                  dense
                  secondaryAction={!notification.read &&
                    <IconButton
                      edge="end" aria-label="mark_read" color="primary"
                      size="small"
                      onClick={() => markAsReadHandler(notification)}
                    >
                      <CircleIcon fontSize="inherit" />
                    </IconButton>
                  }
                >
                  <ListItemButton onClick={() => handleNotificationClick(notification)}>
                    <ListItemIcon>{getNotificationIcon(notification)}</ListItemIcon>
                    <ListItemText
                      primary={
                        <span style={{ fontWeight: notification.read ? "normal" : "bold" , fontSize: "smaller"}}>
                          {notification.description}
                        </span>
                      }
                      secondary={
                        <span style={{ color:  notification.read ? "inherit" : "blue", fontSize: "smaller"}}>
                          {formatDistanceToNow(notification.date)}
                        </span>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              )
            }
          </List>
        </Stack>
      </Drawer>
    </React.Fragment>
  );
};

export default NotificationButton;
