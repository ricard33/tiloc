import React, { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField
} from "@mui/material";
import LearnMore from "../../components/LearnMore";
import ExternalLink from "../../components/ExternalLink";
import { useTranslation } from "react-i18next";
import {
  useCreateCalendarSyncMutation,
  useListBookingChannelsQuery,
  useUpdateCalendarSyncMutation
} from "../../services/api";
import { CalendarSync } from "../../types";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { BookingSource } from "../../common/statusUtils";


type Props = {
  calendarSync: Partial<CalendarSync>
  lodgingId: number;
  onValidate: (payment: CalendarSync) => void;
  onClose: () => void;
}

function ImportCalendarDialog(props: Props) {
  const { calendarSync, lodgingId, onValidate, onClose } = props;
  const { t } = useTranslation();
  const { data: bookingChannels } = useListBookingChannelsQuery();
  const [value, setValue] = useState(calendarSync);
  const [createCalendarSync] = useCreateCalendarSyncMutation();
  const [updateCalendarSync] = useUpdateCalendarSyncMutation();
  const { showError, showSuccess } = useAlert();
  const [error, setError] = useState<{channel_id?: string, source_url?: string }>({});
  const [submitted, setSubmitted] = useState(false);

  function updateErrorState(value: Partial<CalendarSync>) {
    let newError ={
      channel_id: submitted && !value?.channel_id ?
        t("You should select a booking platform")
        : undefined,
      source_url: submitted && !value?.source_url ?
        t("Calendar URL shouldn't be empty")
        : undefined,
    };
    setError(newError);
  }

  const onSubmit = (data: Partial<CalendarSync>) => {
    setSubmitted(true);
    if(!data.channel_id || !data.source_url) {
      updateErrorState(value);
      return;
    }
    const newData = {
      ...calendarSync,
      lodging_id: lodgingId,
      ...data,
    };
    if (!calendarSync.id) {
      createCalendarSync(newData).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during calendarSync creation", error);
          showError(t("Impossible to create calendar synchronization: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Calendar synchronization added"));
          onValidate((result as {data: CalendarSync}).data);
        }
      });
    } else {
      updateCalendarSync(newData).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during calendarSync change", error);
          showError(t("Impossible to modify calendar synchronization: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Calendar synchronization changed"));
          onValidate((result as {data: CalendarSync}).data);
        }
      });
    }
  };

  return (
    <Dialog
      open={calendarSync !== undefined}
      onClose={onClose}
      maxWidth={"md"}
      fullWidth
    >
      <DialogTitle>{t("Import a calendar")}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ marginTop: 2 }}>
          {t("Select the booking platform you want to import the calendar from")}
        </DialogContentText>
        <FormControl fullWidth sx={{ marginTop: 1 }} required>
          <InputLabel id="channel-select-label">{t("Booking platform")}</InputLabel>
          <Select
            name={"channel_id"} required
            label={t("Booking platform")}
            value={value?.channel_id ?? ""}
            error={!!error.channel_id}
            fullWidth
            variant="outlined"
            onChange={(e) => {
              const newValue = { ...value, channel_id: e.target.value as number };
              setValue(newValue)
              updateErrorState(newValue);
            }}
          >
            {bookingChannels && bookingChannels.map((channel) =>
              <MenuItem key={channel.id} value={channel.id}>
                <BookingSource name={channel.name} fullWidth />
              </MenuItem>
            )}
          </Select>
          <FormHelperText error={!!error.channel_id}>{error.channel_id}</FormHelperText>
        </FormControl>

        <DialogContentText sx={{ marginTop: 2 }}>
          {t("Get the address (URL) of the calendar from this booking platform and add it below.")}
        </DialogContentText>
        <TextField
          sx={{ marginTop: 1 }}
          value={value?.source_url ?? ""}
          error={!!error.source_url}
          helperText={error.source_url}
          required name={"source_url"} label={t("Calendar address (URL)")}
          fullWidth variant="outlined"
          onChange={(e) => {
            const newValue = { ...value, source_url: e.target.value };
            setValue(newValue);
            updateErrorState(newValue)
          }}
        />
        <Alert severity="info">
          <Stack alignItems={"flex-start"}>
            {t("Need help finding the calendar URL?")}
            <LearnMore>
              <Stack spacing={1}>
                <ExternalLink
                  href="https://www.airbnb.fr/help/article/99/how-do-i-sync-my-airbnb-calendar-with-another-calendar"
                  label="Airbnb"
                />
                <ExternalLink
                  href="https://partner.booking.com/fr/aide/tarifs-disponibilit%C3%A9s/calendrier-extranet/synchroniser-votre-calendrier-bookingcom-avec?check_logged_in=1"
                  label="Booking"
                />
              </Stack>
            </LearnMore>
          </Stack>
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} color="secondary">{t("Cancel")}</Button>
        <Button onClick={() => onSubmit(value)}>{calendarSync.id ? t("Save") : t("Import")}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImportCalendarDialog;
