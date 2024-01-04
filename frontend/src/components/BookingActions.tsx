import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Booking, User } from "../types";
import {
  Button,
  ButtonGroup,
  ClickAwayListener,
  Grow,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Popper,
  Tooltip
} from "@mui/material";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import EditIcon from "@mui/icons-material/Edit";
import PdfIcon from "@mui/icons-material/PictureAsPdf";
import SaveIcon from "@mui/icons-material/Save";

import { useSelector } from "react-redux";
import { RootState } from "../store";
import ReplayIcon from "@mui/icons-material/Replay";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import Paper from "@mui/material/Paper";
import { useBookingActions } from "../common/bookingActions";
import DeleteIcon from "@mui/icons-material/DeleteForever";


type BookingActionsProps = {
  booking: Booking;
  isDirty?: boolean;
  onReset?: () => void;
  // onClose: () => void;
  onEdit?: () => void;
  onSave?: (closeDialog: boolean) => Promise<Booking>;
  onCancelBooking: () => void;
  onUncancelBooking: () => void;
  onConfirmCancellation?: (confirm: boolean) => void;
  onDelete?: () => void;
  onOpenContract?: (booking: Booking) => void;
  primaryColor?: "inherit" | "primary" | "secondary" | "error" | "info" | "success" | "warning";
};

const BookingActions: React.FunctionComponent<BookingActionsProps> = ({
  ...props
}: BookingActionsProps) => {
  const {
    booking,
    isDirty,
    onReset,
    // onClose,
    onEdit,
    onSave,
    onCancelBooking,
    onUncancelBooking,
    onConfirmCancellation,
    onDelete,
    onOpenContract,
    primaryColor
  } = props;
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const canViewContract = user.permissions.includes("core.view_contract");
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const hasMenu = isDirty && onOpenContract && canViewContract;
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { cancelBooking, uncancelBooking, deleteBooking } = useBookingActions();
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  function handleSaveAndOpenContract() {
    onSave && onSave(false).then((booking: Booking) => {
      console.log("handleSaveAndOpenContract", booking);
      (onOpenContract && canViewContract) && onOpenContract(booking);
    });
  }

  function handleCancel(booking: Booking) {
    cancelBooking(booking)?.then(() => {
      onCancelBooking();
    })
      .finally(() => {
        setConfirmCancel(false);
      });
  }

  function handleUncancel(booking: Booking) {
    uncancelBooking(booking).then(() => {
      onUncancelBooking();
    });
  }

  function handleDelete(booking: Booking) {
    deleteBooking(booking).then(() => {
      if(onDelete) onDelete();
    });
  }


  function handlePreCancel() {
    setConfirmCancel(true);
    if (onConfirmCancellation) onConfirmCancellation(true);
  }

  function handleDiscardCancellation() {
    setConfirmCancel(false);
    if (onConfirmCancellation) onConfirmCancellation(false);
  }

  return (
    <React.Fragment>
      {confirmCancel ?
        <>
          <Button
            startIcon={<EventBusyIcon />} size="small" color="error"
            variant="contained" onClick={() => handleCancel(booking)}
          >{t("Confirm cancellation")}</Button>
          <Button
            startIcon={<ReplayIcon />} size="small" color="primary"
            variant="contained" onClick={() => handleDiscardCancellation()}
          >{t("Discard")}</Button>
        </>
        :
        <>
          {canDelete && !isDirty &&
            (
              booking.cancelled ?
                <Tooltip title={t("Book again")}>
                  <IconButton aria-label="book again" onClick={() => handleUncancel(booking)} color="success">
                    <EventAvailableIcon />
                  </IconButton>
                </Tooltip>
                :
                <>
                  <Tooltip title={t("Cancel booking")}>
                    <IconButton aria-label="cancel" onClick={() => handlePreCancel()} color="error">
                      <EventBusyIcon />
                    </IconButton>
                  </Tooltip>
                </>
            )
          }

          {onEdit &&
            <Tooltip title={t("Modify contract")}>
              <IconButton aria-label="edit" onClick={() => onEdit()} color={primaryColor}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          }

          {isDirty && onReset &&
            <Tooltip title={t("Discard changes")}>
              <IconButton aria-label="reset" onClick={() => onReset()} color={primaryColor}>
                <ReplayIcon />
              </IconButton>
            </Tooltip>
          }

          <ButtonGroup aria-label="split button">
            {
              (isDirty && canEdit && onSave) ?
                <Button
                  autoFocus color={primaryColor} onClick={() => onSave(true)}
                  startIcon={<SaveIcon />}
                >{t("Save")}</Button>
                :
                onOpenContract &&
                <Button
                  autoFocus color={primaryColor} onClick={() => onOpenContract(booking)}
                  startIcon={<PdfIcon />}
                  disabled={!onOpenContract || !canViewContract}
                >{t("Contract")}</Button>
            }
            {hasMenu &&
              <Button
                size="small"
                color={primaryColor}
                aria-controls={open ? "split-button-menu" : undefined}
                aria-expanded={open ? "true" : undefined}
                aria-label="select merge strategy"
                aria-haspopup="menu"
                onClick={handleClick}
              >
                <ArrowDropDownIcon />
              </Button>
            }
          </ButtonGroup>
          {hasMenu &&
            <Popper
              sx={{
                zIndex: 1
              }}
              open={open}
              anchorEl={anchorEl}
              placement="bottom-end"
              role={undefined}
              transition
              disablePortal
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin:
                      placement === "bottom" ? "center top" : "center bottom"
                  }}
                >
                  <Paper>
                    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
                      <MenuList id="split-button-menu" autoFocusItem>
                        <MenuItem
                          onClick={() => handleSaveAndOpenContract()}
                        >
                          <ListItemIcon>
                            <SaveIcon />+<PdfIcon />
                          </ListItemIcon>
                          <ListItemText>{t("Save and open contract")}</ListItemText>
                        </MenuItem>
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
          }
          {
            booking.cancelled &&
            <IconButton title={t("")} color="error" onClick={() => handleDelete(booking)}><DeleteIcon /></IconButton>
          }
        </>
      }
    </React.Fragment>
  );
};

export default BookingActions;
