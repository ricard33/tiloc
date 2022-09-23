import React from "react";
import { useTranslation } from "react-i18next";
import { Booking, User } from "../../types";
import { Dialog, DialogTitle, DialogContent, DialogActions, Grid, Button, Typography } from "@mui/material";
import { DeleteForever as DeleteIcon, PictureAsPdf as PdfIcon, Edit as EditIcon } from "@mui/icons-material";
import useWindowDimensions from "../../common/windowDimensions";
import BookingQuickView from "../BookingQuickView";
import { useSelector } from "react-redux";
import { RootState } from "../../store";


type BookingViewProps = {
  booking: Booking;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenContract?: (booking: Booking) => void;
};

const BookingView: React.FunctionComponent<BookingViewProps> = ({
  ...props
}: BookingViewProps) => {
  const { booking, onClose, onEdit, onDelete, onOpenContract } = props;
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");
  const canViewContract = user.permissions.includes("core.view_contract");
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  return (
    <Dialog
      className="booking-dialog"
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={!!booking}
      maxWidth={width < 1280 ? "sm" : "lg"}
      fullScreen={width < 600}
    >
      <DialogTitle id="simple-dialog-title">
        <Typography variant="h2">
          {t("Booking details")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers >
        <BookingQuickView booking={booking} />
      </DialogContent>
      <DialogActions>
        <Grid container justifyContent="space-between">
          <Grid item>
            {booking && booking.id && canDelete &&
            <Button
              type="button"
              className="delete-button"
              color="secondary"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >{t("Delete")}</Button>}
          </Grid>
          <Grid item>
            {onOpenContract &&  canViewContract &&
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
            {canEdit &&
              <Button
                type="submit"
                color="primary"
                className="button"
                startIcon={<EditIcon />}
                onClick={onEdit}
              >{t("Edit")}</Button>}
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default BookingView;
