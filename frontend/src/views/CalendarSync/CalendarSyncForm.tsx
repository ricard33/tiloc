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
import { FormContainer, SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { BookingChannel, CalendarSync, Lodging } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";


type Props = {
  // calendarSync?: Omit<CalendarSync, 'last_import'|'last_export'>;
  calendarSync?: CalendarSync;
  channels: BookingChannel[];
  lodgings: Lodging[];
  onSubmit?: (calendarSync: CalendarSync) => void;
  onCancel: () => void;
  onDelete?: (calendarSync: CalendarSync) => void;
};

export const CalendarSyncForm: React.FC<Props> = ({
  calendarSync,
  channels,
  lodgings,
  onSubmit,
  onCancel,
  onDelete
}) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<CalendarSync>({ defaultValues: calendarSync });
  const { control } = formContext;
  const { isDirty } = useFormState({ control });

  usePageUnloadAlert(isDirty);

  const channelsOptions: { label: string, id: number }[] = channels ? channels.map((channel) => {
    return { label: channel.name, id: channel.id };
  }) : [];
  const lodgingsOptions: { label: string, id: number }[] = lodgings ? lodgings.map((lodging) => {
    return { label: lodging.name, id: lodging.id };
  }) : [];

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  console.log("isDirty", isDirty);
  // console.log("onSubmit", onSubmit);
  // console.log("getValues", getValues());
  // console.log("dirtyFields", dirtyFields);

  return (
    <FormContainer
      defaultValues={calendarSync}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Calendar synchronization properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={calendarSync ? calendarSync.id : 0} />
          <Grid2 container spacing={2}>
            <Grid2 sm={6} xs={12}>
              <SelectElement
                name={"lodging_id"}
                label={t("Lodging")}
                options={[
                  ...lodgingsOptions
                ]}
                fullWidth
              />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SelectElement
                name={"channel_id"}
                label={t("Booking channel")}
                options={[
                  ...channelsOptions
                ]}
                fullWidth
              />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"active"} label={t("Active ?")} />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement name={"source_url"} label={t("Source URL")} fullWidth />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement name={"url_for_remote"} label={t("Tiloc URL")} disabled fullWidth />
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && calendarSync &&
              <Button
                type="button"
                className="delete-button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(calendarSync)}
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
