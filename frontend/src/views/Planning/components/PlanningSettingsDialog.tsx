import React from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle, FormControlLabel,
} from "@material-ui/core";
// import { makeStyles } from "@material-ui/core/styles";
import Checkbox from "@material-ui/core/Checkbox";

export type PlanningSettings = {
  showPaymentStatus: boolean;
}

// const useStyles = makeStyles((/*theme: Theme*/) => ({}));

type Props = {
  open: boolean;
  settings: PlanningSettings;
  onClose: (settings?: PlanningSettings) => void;
};

const PlanningSettingsDialog: React.FunctionComponent<Props> = ({ open, settings, onClose }: Props) => {
  // const classes = useStyles();
  const { t } = useTranslation();
  const { handleSubmit, control } = useForm<PlanningSettings>({
    defaultValues: {
      showPaymentStatus: true
    }
  });

  const onSubmit: SubmitHandler<PlanningSettings> = data => {
    console.log(data);
    onClose(data);
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
                // defaultValue={settings.showPaymentStatus}
                render={({ field }) =>
                  <Checkbox
                    defaultChecked={settings.showPaymentStatus}
                    {...field}
                  />}
              />
            }
            label={t("Show payment status on bookings")}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} color="default">
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

