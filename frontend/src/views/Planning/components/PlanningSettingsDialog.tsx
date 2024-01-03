import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack } from "@mui/material";
import { CheckboxElement, FormContainer, TextFieldElement } from "react-hook-form-mui";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";

export type PlanningSettings = {
  showPaymentStatus: boolean;
  monthsToDisplay: number;
  scrollingTimeline: boolean;
}


type Props = {
  open: boolean;
  settings: PlanningSettings;
  onClose: (settings?: PlanningSettings) => void;
};

const PlanningSettingsDialog: React.FunctionComponent<Props> = ({ open, settings, onClose }: Props) => {
  // const classes = useStyles();
  const { t } = useTranslation();
  const formContext = useForm<PlanningSettings>({
    defaultValues: {
      showPaymentStatus: settings.showPaymentStatus,
      monthsToDisplay: settings.monthsToDisplay,
      scrollingTimeline: settings.scrollingTimeline,
    }
  });
  const { handleSubmit, control } = formContext;

  const onSubmit: SubmitHandler<PlanningSettings> = data => {
    // console.log(data);
    onClose({
      ...data,
      monthsToDisplay: Number(data.monthsToDisplay)
    });
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
          <Stack margin={1}>
            {/*<CheckboxElement*/}
            {/*  control={control}*/}
            {/*  name="showPaymentStatus"*/}
            {/*  label={t<string>("Show payment status on bookings")}*/}
            {/*  // defaultChecked={settings.showPaymentStatus}*/}
            {/*/>*/}
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
            />

            <CheckboxElement
              control={control}
              name="scrollingTimeline"
              label={t<string>("Display bookings as scrolling timeline")}
            />
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

