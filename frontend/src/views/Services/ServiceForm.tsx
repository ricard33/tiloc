import React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader, InputAdornment, Stack,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Service } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import HelpTooltip from "../../components/HelpTooltip";


type Props = {
  service?: Service;
  onSubmit?: (service: Service) => void;
  onCancel: () => void;
  onDelete?: (service: Service) => void;
};

export const ServiceForm: React.FC<Props> = ({ service, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<Service>({ defaultValues: service });
  const { control, watch } = formContext;
  const { isDirty } = useFormState({ control });
  const isFlatRate = watch("is_flat_rate", service?.is_flat_rate);

  usePageUnloadAlert(isDirty);

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  return (
    <FormContainer
      defaultValues={service}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Service properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={service ? service.id : 0} />
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <TextFieldElement name={"designation"} label={t("Designation")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"reference"} label={t("Reference")} fullWidth required />
            </Grid2>
            <Grid2 sm={3} xs={12}>
              <TextFieldElement
                name={"unit_price"}
                label={isFlatRate ? t("Unit price") : t("Daily unit price")}
                type={"number"}
                fullWidth
                required
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            {/*<Grid2 sm={3} xs={6}>*/}
            {/*  <TextFieldElement*/}
            {/*    name={"vat"}*/}
            {/*    label={t("VAT")}*/}
            {/*    type={"number"}*/}
            {/*    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}*/}
            {/*  />*/}
            {/*</Grid2>*/}
            <Grid2 sm={6} xs={12}>
              <HelpTooltip
                helpContent={t("If set, the price is fixed whatever the duration of the booking.")}
              >
                <SwitchElement name={"is_flat_rate"} label={t("Is flat rate?")} />
              </HelpTooltip>
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <HelpTooltip
                helpContent={t("Service provided by external partner. The service price wont be included in booking price because it have to be paid directly to the provider.")}
              >
                <SwitchElement name={"not_included_in_price"} label={t("External provider")} />
              </HelpTooltip>
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && service &&
              <Button
                type="button"
                className="delete-button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(service)}
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
