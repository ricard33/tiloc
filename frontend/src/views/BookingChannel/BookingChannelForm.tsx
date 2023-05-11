import React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader, Stack,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, SelectElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { BookingChannel, BookingStatus } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";


type Props = {
  bookingChannel?: BookingChannel;
  bookingStatuses: BookingStatus[];
  onSubmit?: (bookingChannel: BookingChannel) => void;
  onCancel: () => void;
  onDelete?: (bookingChannel: BookingChannel) => void;
};

export const BookingChannelForm: React.FC<Props> = ({
  bookingChannel,
  bookingStatuses,
  onSubmit,
  onCancel,
  onDelete
}) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<BookingChannel>({ defaultValues: bookingChannel });
  const { control } = formContext;
  const { isDirty } = useFormState({ control });

  usePageUnloadAlert(isDirty);

  const statusesOptions: { label: string, id: number }[] = bookingStatuses ? bookingStatuses.map((status) => {
    return { label: status.name, id: status.id };
  }) : [];

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  const onSubmitHandler = (bookingChannel: BookingChannel) => {
    if (onSubmit)
      return onSubmit({
        ...bookingChannel,
        default_booking_status_id: bookingChannel.default_booking_status_id === 0 ? null : bookingChannel.default_booking_status_id
      });
  };


  return (
    <FormContainer
      defaultValues={bookingChannel}
      onSuccess={onSubmitHandler}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Booking channel properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={bookingChannel ? bookingChannel.id : 0} />
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <TextFieldElement name={"name"} label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SelectElement
                name={"default_booking_status_id"}
                label={t("Default booking status")}
                options={[
                  { label: "-", id: 0 },
                  ...statusesOptions
                ]}
                fullWidth
              />
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && bookingChannel &&
              <Button
                type="button"
                className="delete-button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(bookingChannel)}
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
