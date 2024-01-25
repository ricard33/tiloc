import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { CheckboxElement, FormContainer, SelectElement, TextFieldElement } from "react-hook-form-mui";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";

export type PlanningSettings = {
  display: "timeline" | "annual";
  showPaymentStatus: boolean;
  monthsToDisplay: number;
  showPrices: boolean
}

export const loadPlanningSettings = (): PlanningSettings => {
  const getStorageValue = (key: string, defaultValue: string | {}) => {
    // getting stored value
    const saved = localStorage.getItem(key);
    const initial = saved ? JSON.parse(saved) : defaultValue;
    return typeof initial === "undefined" ? defaultValue : initial;
  };
  return {
    display: getStorageValue("planning.display", "timeline"),
    monthsToDisplay: getStorageValue("planning.monthsToDisplay", 12),
    showPaymentStatus: getStorageValue("planning.showPaymentStatus", true),
    showPrices: getStorageValue("planning.showPrices", true),
  };
};

export const savePlanningSettings = (settings: PlanningSettings) => {
  localStorage.setItem("planning.display", JSON.stringify(settings.display));
  localStorage.setItem("planning.monthsToDisplay", JSON.stringify(settings.monthsToDisplay));
  localStorage.setItem("planning.showPaymentStatus", JSON.stringify(settings.showPaymentStatus));
  localStorage.setItem("planning.showPrices", JSON.stringify(settings.showPrices));

};

type Props = {
  open: boolean;
  settings: PlanningSettings;
  onClose: (settings?: PlanningSettings) => void;
};

const PlanningSettingsDialog: React.FunctionComponent<Props> = ({ open, settings, onClose }: Props) => {
  // const classes = useStyles();
  const { t } = useTranslation();
  const formContext = useForm<PlanningSettings>({
    defaultValues: settings
  });
  const { handleSubmit, control, watch } = formContext;
  const display = watch("display", settings.display);

  const onSubmit: SubmitHandler<PlanningSettings> = data => {
    // console.log(data);
    const newSettings = {
      ...data,
      monthsToDisplay: Number(data.monthsToDisplay)
    };
    savePlanningSettings(newSettings);
    onClose(newSettings);
  };

  return (
    <Dialog open={open} onClose={() => onClose()} aria-labelledby="form-dialog-title" maxWidth="sm">
      <DialogTitle id="form-dialog-title">{t("Planning settings")}</DialogTitle>
      <DialogContent>
        <FormContainer
          formContext={formContext}
          // defaultValues={lodging}
          onSuccess={onSubmit}
        >
          <Stack margin={1} spacing={2}>
            {/*<CheckboxElement*/}
            {/*  control={control}*/}
            {/*  name="showPaymentStatus"*/}
            {/*  label={t<string>("Show payment status on bookings")}*/}
            {/*  // defaultChecked={settings.showPaymentStatus}*/}
            {/*/>*/}
            <SelectElement
              name={"display"}
              label={t("Display type")}
              options={[
                { id: "timeline", label: t("Scrolling timeline") },
                { id: "annual", label: t("Annual calendar") }
              ]}
            />
            {display === "annual" &&
              <TextFieldElement
                control={control}
                name="monthsToDisplay"
                label={t<string>("Number of months to display")}
                // defaultValue={settings.monthsToDisplay}
                type={"number"}
                required
                validation={{
                  min: { value: 1, message: t("Minimum 1 month") },
                  max: { value: 12, message: t("Maximum 12 month") }
                }}
              />}

            {display === "timeline" &&
              <CheckboxElement
                control={control}
                name="showPrices"
                label={t<string>("Show prices")}
              />}
          </Stack>

        </FormContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} color="secondary" startIcon={<CancelIcon />}>
          {t("Cancel")}
        </Button>
        <Button onClick={handleSubmit(onSubmit)} color="primary" type="submit" startIcon={<SaveIcon />}>
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanningSettingsDialog;

