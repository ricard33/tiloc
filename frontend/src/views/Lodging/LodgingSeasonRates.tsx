import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { TextFieldElement } from "react-hook-form-mui";
import {
  Alert,
  Button,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow
} from "@mui/material";
import { LodgingSeasonRateRow, SeasonCalendar } from "../../types";

type Props = {
  calendar?: SeasonCalendar;
};

const BLANK_ROW = (season: number): LodgingSeasonRateRow => ({ season, nightly_rate: "", weekend_rate: "", min_nights: "" });

// Bound directly to the parent Lodging form's `season_rates` field (no API calls of its
// own): the grid is edited in memory and saved together with the rest of the lodging in one
// submit, for both a brand-new and an existing lodging.
export const LodgingSeasonRates: React.FC<Props> = ({ calendar }) => {
  const { t } = useTranslation();
  const { control, getValues, setValue } = useFormContext();

  useEffect(() => {
    if (!calendar) {
      setValue("season_rates", []);
      return;
    }
    const existing = (getValues("season_rates") || []) as LodgingSeasonRateRow[];
    const bySeasonId = new Map(existing.map((row) => [row.season, row]));
    setValue(
      "season_rates",
      calendar.seasons.map((season) => bySeasonId.get(season.id as number) ?? BLANK_ROW(season.id as number))
    );
    // Only resync when the selected calendar itself changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendar?.id]);

  if (!calendar) {
    return <Alert severity="info">{t("Select a season calendar above to set per-season rates.")}</Alert>;
  }
  if (!calendar.seasons.length) {
    return <Alert severity="info">{t("This season calendar has no season yet.")}</Alert>;
  }

  return (
    <Stack spacing={1}>
      <Alert severity="info">
        {t("Leave a season blank to fall back to the lodging's default daily rate.")}
      </Alert>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>{t("Season")}</TableCell>
            <TableCell>{t("Nightly rate")}</TableCell>
            <TableCell>{t("Weekend rate")}</TableCell>
            <TableCell>{t("Minimum nights")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {calendar.seasons.map((season, index) => (
            <TableRow key={season.id}>
              <TableCell>{season.name}</TableCell>
              <TableCell>
                <TextFieldElement
                  control={control}
                  name={`season_rates.${index}.nightly_rate`}
                  type="number"
                  size="small"
                  InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                />
              </TableCell>
              <TableCell>
                <TextFieldElement
                  control={control}
                  name={`season_rates.${index}.weekend_rate`}
                  type="number"
                  size="small"
                  InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                />
              </TableCell>
              <TableCell>
                <TextFieldElement
                  control={control}
                  name={`season_rates.${index}.min_nights`}
                  type="number"
                  size="small"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Button component="a" href="/settings/seasons" target="_blank" size="small">
        {t("Manage season calendars")}
      </Button>
    </Stack>
  );
};
