import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ClearIcon from "@mui/icons-material/Clear";
import { LodgingSeasonRate, SeasonCalendar } from "../../types";
import {
  useCreateLodgingSeasonRateMutation,
  useDeleteLodgingSeasonRateMutation,
  useListLodgingSeasonRatesQuery,
  useUpdateLodgingSeasonRateMutation
} from "../../services/api";
import { useAlert } from "../../common/alertUtils";
import { fetchErrorDecode } from "../../common/apiUtils";

type Props = {
  lodgingId: number;
  calendar?: SeasonCalendar;
};

type RowState = {
  nightly_rate: string;
  weekend_rate: string;
  min_nights: string;
};

const toRowState = (rate?: LodgingSeasonRate): RowState => ({
  nightly_rate: rate ? String(rate.nightly_rate) : "",
  weekend_rate: rate && rate.weekend_rate != null ? String(rate.weekend_rate) : "",
  min_nights: rate && rate.min_nights != null ? String(rate.min_nights) : ""
});

export const LodgingSeasonRates: React.FC<Props> = ({ lodgingId, calendar }) => {
  const { t } = useTranslation();
  const { data: rates } = useListLodgingSeasonRatesQuery({ lodging: lodgingId });
  const [createRate] = useCreateLodgingSeasonRateMutation();
  const [updateRate] = useUpdateLodgingSeasonRateMutation();
  const [deleteRate] = useDeleteLodgingSeasonRateMutation();
  const { showError, showSuccess } = useAlert();
  const [edited, setEdited] = useState<Record<number, RowState>>({});

  const rateForSeason = (seasonId: number) => (rates || []).find((r) => r.season === seasonId);

  useEffect(() => {
    if (!rates || !calendar) return;
    const initial: Record<number, RowState> = {};
    for (const season of calendar.seasons) {
      if (season.id) initial[season.id] = toRowState(rateForSeason(season.id));
    }
    setEdited(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rates, calendar]);

  if (!calendar) {
    return <Alert severity="info">{t("Select a season calendar above to set per-season rates.")}</Alert>;
  }
  if (!calendar.seasons.length) {
    return <Alert severity="info">{t("This season calendar has no season yet.")}</Alert>;
  }

  const setField = (seasonId: number, field: keyof RowState, value: string) => {
    setEdited((prev) => ({ ...prev, [seasonId]: { ...prev[seasonId], [field]: value } }));
  };

  const onSave = async (seasonId: number) => {
    const row = edited[seasonId];
    if (!row || row.nightly_rate === "") {
      showError(t("A nightly rate is required."));
      return;
    }
    const payload: Partial<LodgingSeasonRate> = {
      lodging: lodgingId,
      season: seasonId,
      nightly_rate: Number(row.nightly_rate),
      weekend_rate: row.weekend_rate === "" ? null : Number(row.weekend_rate),
      min_nights: row.min_nights === "" ? null : Number(row.min_nights)
    };
    const existing = rateForSeason(seasonId);
    const result = existing
      ? await updateRate({ ...payload, id: existing.id })
      : await createRate(payload);
    if ((result as any).error) {
      showError(t("Impossible to save: ") + fetchErrorDecode((result as any).error));
    } else {
      showSuccess(t("Rate saved"));
    }
  };

  const onClear = async (seasonId: number) => {
    const existing = rateForSeason(seasonId);
    if (existing) {
      const result = await deleteRate(existing);
      if ((result as any).error) {
        showError(t("Impossible to delete: ") + fetchErrorDecode((result as any).error));
        return;
      }
    }
    setField(seasonId, "nightly_rate", "");
    setField(seasonId, "weekend_rate", "");
    setField(seasonId, "min_nights", "");
  };

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
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {calendar.seasons.map((season) => {
            const seasonId = season.id as number;
            const row = edited[seasonId] || toRowState();
            return (
              <TableRow key={seasonId}>
                <TableCell>{season.name}</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={row.nightly_rate}
                    onChange={(e) => setField(seasonId, "nightly_rate", e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={row.weekend_rate}
                    onChange={(e) => setField(seasonId, "weekend_rate", e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={row.min_nights}
                    onChange={(e) => setField(seasonId, "min_nights", e.target.value)}
                  />
                </TableCell>
                <TableCell>
                  <IconButton aria-label={t("Save")} onClick={() => onSave(seasonId)} size="small">
                    <SaveIcon fontSize="small" />
                  </IconButton>
                  <IconButton aria-label={t("Clear")} onClick={() => onClear(seasonId)} size="small">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Button component="a" href="/settings/seasons" target="_blank" size="small">
        {t("Manage season calendars")}
      </Button>
    </Stack>
  );
};
