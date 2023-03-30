import React from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Stack, Unstable_Grid2 as Grid2 } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { BookingStatus } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import ColorPickerElement from "../../components/Fields/ColorPickerElement";
import DeleteIcon from "@mui/icons-material/DeleteForever";


type Props = {
  bookingStatus?: BookingStatus;
  onSubmit?: (bookingStatus: BookingStatus) => void;
  onCancel: () => void;
  onDelete?: (bookingStatus: BookingStatus) => void;
};

export const BookingStatusForm: React.FC<Props> = ({ bookingStatus, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<BookingStatus>({ defaultValues: bookingStatus });
  const { control } = formContext;
  const { isDirty } = useFormState({ control });

  usePageUnloadAlert(isDirty);

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  return (
    <FormContainer
      defaultValues={bookingStatus}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Booking status properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={bookingStatus ? bookingStatus.id : 0} />
          <input type="hidden" name={"rank"} value={bookingStatus ? bookingStatus.rank : 0} />
          <Grid2 container spacing={2}>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"name"} label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <ColorPickerElement name={"color"} label={t("Color")} required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"no_stats"} label={t("Exclude from statistics")} />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"finalized"} label={t("Booking is finalized")} />
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && bookingStatus &&
              <Button
                type="button"
                className="delete-button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(bookingStatus)}
              >{t("Delete")}</Button>
            }
            {isDirty && onSubmit ?
              <>
                <Button color={"secondary"} onClick={() => onCancelHandler()}>{t("Cancel")}</Button>
                <Button type={"submit"} color={"primary"} startIcon={<SaveIcon />}>{t("Save")}</Button>
              </> :
              <Button onClick={() => onCancel()} color={"primary"}>{t("Close")}</Button>
            }
          </Stack>
        </CardActions>
      </Card>
    </FormContainer>
  );
};
