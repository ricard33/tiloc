import React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, FormControlLabel, TextField
} from "@mui/material";
import Checkbox from "@mui/material/Checkbox";

export type PlanningSettings = {
  showPaymentStatus: boolean;
  monthsToDisplay: number;
}


type Props = {
  open: boolean;
  settings: PlanningSettings;
  onClose: (settings?: PlanningSettings) => void;
};

const PlanningSettingsDialog: React.FunctionComponent<Props> = ({ open, settings, onClose }: Props) => {
  // const classes = useStyles();
  const { t } = useTranslation();
  const { handleSubmit, control, formState } = useForm<PlanningSettings>({
    defaultValues: {
      showPaymentStatus: settings.showPaymentStatus,
      monthsToDisplay: settings.monthsToDisplay,
    }
  });
  const { errors } = formState;

  const onSubmit: SubmitHandler<PlanningSettings> = data => {
    console.log(data);
    onClose({
      ...data,
      monthsToDisplay: Number(data.monthsToDisplay),
    });
  };

  return (
    <Dialog open={open} onClose={() => onClose()} aria-labelledby="form-dialog-title" maxWidth="sm">
      <DialogTitle id="form-dialog-title">{t("Planning settings")}</DialogTitle>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControlLabel
            control={
              <Controller
                control={control}
                name="showPaymentStatus"
                render={({ field }) =>
                  <Checkbox
                    defaultChecked={settings.showPaymentStatus}
                    {...field}
                  />}
              />
            }
            label={t<string>("Show payment status on bookings")}
          />
          <FormControlLabel
            control={
              <Controller
                control={control}
                name="monthsToDisplay"
                defaultValue={settings.monthsToDisplay}
                rules={{
                  min: {
                    value: 1,
                    message: t("Minimum 1 month")
                  },
                  max: {
                    value: 12,
                    message: t("Maximum 12 month")
                  },
                  // valueAsNumber: true
                }}
                render={({ field }) =>
                  <TextField
                    error={!!errors.monthsToDisplay}
                    helperText={errors.monthsToDisplay && errors.monthsToDisplay.message}
                    InputProps={{ type: "number" }}
                    {...field}
                  />}
              />
            }
            label={t<string>("Number of months to display")}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()}>
          {t("Cancel")}
        </Button>
        <Button onClick={handleSubmit(onSubmit)} color="primary" type="submit">
          {t("Save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PlanningSettingsDialog;

