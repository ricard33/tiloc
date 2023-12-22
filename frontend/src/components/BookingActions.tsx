import React from "react";
import { useTranslation } from "react-i18next";
import { Booking, User } from "../types";
import { Button, Grid } from "@mui/material";
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EventBusyIcon from "@mui/icons-material/EventBusy";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import EditIcon from "@mui/icons-material/Edit";
import PdfIcon from "@mui/icons-material/PictureAsPdf";
import SaveIcon from "@mui/icons-material/Save";

import { useSelector } from "react-redux";
import { RootState } from "../store";


type BookingActionsProps = {
  booking: Booking;
  onClose: () => void;
  onEdit?: () => void;
  onSave?: () => void;
  onCancelBooking: () => void;
  onUncancelBooking: () => void;
  onDelete: () => void;
  onOpenContract?: (booking: Booking) => void;
};

const BookingActions: React.FunctionComponent<BookingActionsProps> = ({
  ...props
}: BookingActionsProps) => {
  const { booking, onClose, onEdit, onSave, onCancelBooking, onUncancelBooking, onDelete, onOpenContract } = props;
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const canViewContract = user.permissions.includes("core.view_contract");
  const { t } = useTranslation();

  return (
    <>
      <Grid container justifyContent="space-between">
        <Grid item>
          {booking && booking.id && canDelete && (
            booking.cancelled ?
              <>
                <Button
                  type="button"
                  className="uncancel-button"
                  color="success"
                  startIcon={<EventAvailableIcon />}
                  onClick={onUncancelBooking}
                >{t("Book again")}</Button>
                <Button
                  type="button"
                  className="delete-button"
                  color="secondary"
                  startIcon={<DeleteIcon />}
                  onClick={onDelete}
                >{t("Delete")}</Button>
              </>
              :
              <Button
                type="button"
                className="cancel-button"
                color="secondary"
                startIcon={<EventBusyIcon />}
                onClick={onCancelBooking}
              >{t("Cancel")}</Button>
          )}
        </Grid>
        <Grid item>
          {onOpenContract && canViewContract &&
            <Button
              type="button"
              disabled={!booking || !booking.id}
              className="button"
              startIcon={<PdfIcon />}
              onClick={() => onOpenContract(booking)}
            >{t("Contract")}</Button>}
        </Grid>
        <Grid item>
          <Button type="button" onClick={onClose}>{t("Close")}</Button>
          {canEdit && onEdit &&
            <Button
              type="submit"
              color="primary"
              className="button"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >{t("Edit")}</Button>}
          {canEdit &&
            <Button
              type="submit"
              color="primary"
              className="button"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={!onSave}
            >{t("Save")}</Button>}
        </Grid>
      </Grid>
    </>
  );
};

export default BookingActions;
