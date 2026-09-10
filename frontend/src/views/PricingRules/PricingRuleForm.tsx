import React from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  InputAdornment,
  Stack,
  Typography,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import {
  DatePickerElement,
  FormContainer,
  MultiSelectElement,
  SelectElement,
  SwitchElement,
  TextFieldElement
} from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import { Lodging, PricingAdjustment } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import HelpTooltip from "../../components/HelpTooltip";

type Props = {
  rule?: PricingAdjustment;
  lodgings: Lodging[];
  onSubmit?: (rule: PricingAdjustment) => void;
  onCancel: () => void;
  onDelete?: (rule: PricingAdjustment) => void;
};

const EMPTY_RULE: Record<string, unknown> = {
  name: "",
  lodging: "",
  adjustment_type: "percent",
  value: -10,
  priority: 0,
  stackable: true,
  active: true,
  applicable_weekdays: []
};

export const PricingRuleForm: React.FC<Props> = ({ rule, lodgings, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<PricingAdjustment>({
    defaultValues: rule
      ? ({ ...rule, lodging: rule.lodging ?? "", applicable_weekdays: rule.applicable_weekdays ?? [] } as unknown as PricingAdjustment)
      : (EMPTY_RULE as unknown as PricingAdjustment)
  });
  const { control, watch, setValue } = formContext;
  const { isDirty } = useFormState({ control });
  const adjustmentType = watch("adjustment_type", rule?.adjustment_type ?? "percent");

  usePageUnloadAlert(isDirty);

  const weekdayOptions = [
    t("Monday"), t("Tuesday"), t("Wednesday"), t("Thursday"), t("Friday"), t("Saturday"), t("Sunday")
  ].map((label, id) => ({ id, label }));

  const applyPreset = (kind: "last_minute" | "early_bird") => {
    if (kind === "last_minute") {
      setValue("max_days_before_arrival", 30, { shouldDirty: true });
      setValue("min_days_before_arrival", null, { shouldDirty: true });
      if (!watch("name")) setValue("name", t("Last minute"), { shouldDirty: true });
    } else {
      setValue("min_days_before_arrival", 90, { shouldDirty: true });
      setValue("max_days_before_arrival", null, { shouldDirty: true });
      if (!watch("name")) setValue("name", t("Early bird"), { shouldDirty: true });
    }
  };

  const onCancelHandler = () => unsavedChangesConfirm().then(onCancel);

  const onSubmitHandler = (data: PricingAdjustment) => {
    if (onSubmit) onSubmit({ ...rule, ...data });
  };

  return (
    <FormContainer formContext={formContext} onSuccess={onSubmitHandler}>
      <Card sx={{ maxWidth: "900px" }}>
        <CardHeader title={t("Pricing rule")} />
        <CardContent>
          <Grid2 container spacing={2}>
            <Grid2 xs={12} sm={6}>
              <TextFieldElement name="name" label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 xs={12} sm={6}>
              <SelectElement
                name="lodging"
                label={t("Applies to")}
                options={[
                  { id: "", label: t("All lodgings") },
                  ...lodgings.map(l => ({ id: l.id, label: l.name }))
                ]}
                fullWidth
              />
            </Grid2>
            <Grid2 xs={6} sm={4}>
              <SelectElement
                name="adjustment_type"
                label={t("Type")}
                options={[
                  { id: "percent", label: t("Percentage") },
                  { id: "fixed", label: t("Fixed amount") }
                ]}
                fullWidth
              />
            </Grid2>
            <Grid2 xs={6} sm={4}>
              <HelpTooltip helpContent={t("Negative for a discount, positive for a surcharge.")}>
                <TextFieldElement
                  name="value"
                  label={t("Value")}
                  type="number"
                  fullWidth
                  required
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">{adjustmentType === "percent" ? "%" : "€"}</InputAdornment>
                    )
                  }}
                />
              </HelpTooltip>
            </Grid2>
            <Grid2 xs={12} sm={4}>
              <SwitchElement name="active" label={t("Active")} />
            </Grid2>
          </Grid2>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6">{t("Conditions")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("All conditions must be met. Leave a field empty to ignore it.")}
          </Typography>
          <Grid2 container spacing={2} sx={{ mt: 0.5 }}>
            <Grid2 xs={6} sm={3}>
              <TextFieldElement name="min_nights" label={t("Min nights")} type="number" fullWidth />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <TextFieldElement name="max_nights" label={t("Max nights")} type="number" fullWidth />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <TextFieldElement
                name="min_days_before_arrival" label={t("Min days before arrival")} type="number" fullWidth
              />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <TextFieldElement
                name="max_days_before_arrival" label={t("Max days before arrival")} type="number" fullWidth
              />
            </Grid2>
            <Grid2 xs={12}>
              <Stack direction="row" spacing={1}>
                <Button size="small" variant="outlined" onClick={() => applyPreset("last_minute")}>
                  {t("Last minute")}
                </Button>
                <Button size="small" variant="outlined" onClick={() => applyPreset("early_bird")}>
                  {t("Early bird")}
                </Button>
              </Stack>
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <DatePickerElement control={control} name="stay_begin" label={t("Stay from")} />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <DatePickerElement control={control} name="stay_end" label={t("Stay until")} />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <DatePickerElement control={control} name="booking_begin" label={t("Booked from")} />
            </Grid2>
            <Grid2 xs={6} sm={3}>
              <DatePickerElement control={control} name="booking_end" label={t("Booked until")} />
            </Grid2>
            <Grid2 xs={12}>
              <MultiSelectElement
                name="applicable_weekdays"
                label={t("Applicable weekdays")}
                options={weekdayOptions}
                showChips
                fullWidth
              />
            </Grid2>
          </Grid2>

          <Divider sx={{ my: 2 }} />
          <Grid2 container spacing={2}>
            <Grid2 xs={6} sm={3}>
              <HelpTooltip helpContent={t("Lower priority rules are applied first.")}>
                <TextFieldElement name="priority" label={t("Priority")} type="number" fullWidth />
              </HelpTooltip>
            </Grid2>
            <Grid2 xs={6} sm={9}>
              <HelpTooltip helpContent={t("If off, no lower-priority rule is applied after this one.")}>
                <SwitchElement name="stackable" label={t("Stackable")} />
              </HelpTooltip>
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && rule && (
              <Button
                type="button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(rule)}
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
