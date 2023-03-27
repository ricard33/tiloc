import React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader, InputAdornment,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Service } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import ColorPickerElement from "../../components/Fields/ColorPickerElement";


type Props = {
  service: Service;
  onSubmit: (service: Service) => void;
  onCancel: () => void;
};

export const ServiceForm: React.FC<Props> = ({ service, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<Service>({ defaultValues: service });
  const { control } = formContext;
  const { isDirty } = useFormState({ control });

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
        <CardHeader title={t("Booking status properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={service!.id} />
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <TextFieldElement name={"designation"} label={t("Designation")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"reference"} label={t("Reference")} required />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"unit_price"}
                label={t("Unit price")}
                type={"number"}
                required
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"vat"}
                label={t("VAT")}
                type={"number"}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"is_flat_rate"} label={t("Is flat rate?")} />
            </Grid2>
            {/*<Grid2 sm={6} xs={12}>*/}
            {/*  <SwitchElement name={"included_in_booking"} label={t("Included in booking")} />*/}
            {/*</Grid2>*/}
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"not_included_in_price"} label={t("Not included in price")} />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"auto_add_booking"} label={t("Automatically added to new bookings")} />
            </Grid2>
            {/*<Grid2 sm={6} xs={12}>*/}
            {/*  <SwitchElement name={"auto_add_invoice"} label={t("Automatically added to invoices")} />*/}
            {/*</Grid2>*/}
          </Grid2>
        </CardContent>
        <CardActions
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end"
          }}
        >
          {isDirty ?
            <>
              <Button color={"secondary"} onClick={() => onCancelHandler()}>{t("Cancel")}</Button>
              <Button type={"submit"} color={"primary"} startIcon={<SaveIcon />}>{t("Save")}</Button>
            </> :
            <Button onClick={() => onCancel()} color={"primary"}>{t("Close")}</Button>
          }
        </CardActions>
      </Card>
    </FormContainer>
  );
};
