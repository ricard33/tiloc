import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  IconButton,
  Stack,
  Typography,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { FormContainer, TextFieldElement, DatePickerElement } from "react-hook-form-mui";
import { useFieldArray, useForm, useFormState } from "react-hook-form";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import AddIcon from "@mui/icons-material/Add";
import { SeasonCalendar } from "../../types";
import { usePageUnloadAlert } from "../../common/formUtils";
import { useUnsavedChangesConfirm } from "../../common/dialogs";

type Props = {
  calendar?: SeasonCalendar;
  onSubmit?: (calendar: SeasonCalendar) => void;
  onCancel: () => void;
  onDelete?: (calendar: SeasonCalendar) => void;
};

const EMPTY_CALENDAR: SeasonCalendar = { name: "", notes: "", seasons: [] };

const SeasonRanges: React.FC<{ control: any; seasonIndex: number }> = ({ control, seasonIndex }) => {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({ control, name: `seasons.${seasonIndex}.date_ranges` });
  return (
    <Stack spacing={1} sx={{ mt: 1 }}>
      {fields.map((field, rangeIndex) => (
        <Grid2 container spacing={1} key={field.id} alignItems="center">
          <Grid2 xs={5}>
            <DatePickerElement
              control={control}
              name={`seasons.${seasonIndex}.date_ranges.${rangeIndex}.begin_date`}
              label={t("First night")}
              required
            />
          </Grid2>
          <Grid2 xs={5}>
            <DatePickerElement
              control={control}
              name={`seasons.${seasonIndex}.date_ranges.${rangeIndex}.end_date`}
              label={t("Last night")}
              required
            />
          </Grid2>
          <Grid2 xs={2}>
            <IconButton aria-label={t("Delete")} onClick={() => remove(rangeIndex)} size="small">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Grid2>
        </Grid2>
      ))}
      <Button size="small" startIcon={<AddIcon />} onClick={() => append({ begin_date: null, end_date: null })}>
        {t("Add a date range")}
      </Button>
    </Stack>
  );
};

export const SeasonCalendarForm: React.FC<Props> = ({ calendar, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<SeasonCalendar>({ defaultValues: calendar ?? EMPTY_CALENDAR });
  const { control } = formContext;
  const { isDirty } = useFormState({ control });
  const seasons = useFieldArray({ control, name: "seasons" });

  usePageUnloadAlert(isDirty);

  const onCancelHandler = () => {
    unsavedChangesConfirm().then(onCancel);
  };

  const onSubmitHandler = (data: SeasonCalendar) => {
    if (onSubmit) onSubmit({ ...calendar, ...data });
  };

  return (
    <FormContainer formContext={formContext} onSuccess={onSubmitHandler}>
      <Card sx={{ maxWidth: "900px" }}>
        <CardHeader title={t("Season calendar")} />
        <CardContent>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} sm={6}>
              <TextFieldElement name="name" label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement name="notes" label={t("Notes")} fullWidth multiline minRows={2} />
            </Grid2>
          </Grid2>

          <Typography variant="h6" sx={{ mt: 3 }}>{t("Seasons")}</Typography>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {seasons.fields.map((season, seasonIndex) => (
              <Card key={season.id} variant="outlined" sx={{ p: 2 }}>
                <Grid2 container spacing={1} alignItems="center">
                  <Grid2 xs={12} sm={5}>
                    <TextFieldElement
                      name={`seasons.${seasonIndex}.name`}
                      label={t("Season name")}
                      fullWidth
                      required
                    />
                  </Grid2>
                  <Grid2 xs={8} sm={4}>
                    <TextFieldElement
                      name={`seasons.${seasonIndex}.color`}
                      label={t("Color")}
                      type="color"
                      fullWidth
                    />
                  </Grid2>
                  <Grid2 xs={4} sm={2}>
                    <TextFieldElement
                      name={`seasons.${seasonIndex}.rank`}
                      label={t("Rank")}
                      type="number"
                      fullWidth
                    />
                  </Grid2>
                  <Grid2 xs={12} sm={1} sx={{ textAlign: "right" }}>
                    <IconButton aria-label={t("Delete")} onClick={() => seasons.remove(seasonIndex)}>
                      <DeleteIcon />
                    </IconButton>
                  </Grid2>
                </Grid2>
                <SeasonRanges control={control} seasonIndex={seasonIndex} />
              </Card>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={() => seasons.append({ name: "", color: "#3788d8", rank: seasons.fields.length, date_ranges: [] })}
            >
              {t("Add a season")}
            </Button>
          </Stack>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && calendar && (
              <Button
                type="button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(calendar)}
              >
                {t("Delete")}
              </Button>
            )}
            {isDirty && onSubmit ? (
              <>
                <Button color="secondary" onClick={onCancelHandler}>{t("Cancel")}</Button>
                <Button type="submit" color="primary" startIcon={<SaveIcon />}>{t("Save")}</Button>
              </>
            ) : (
              <Button onClick={onCancel} color="primary">{t("Close")}</Button>
            )}
          </Stack>
        </CardActions>
      </Card>
    </FormContainer>
  );
};
