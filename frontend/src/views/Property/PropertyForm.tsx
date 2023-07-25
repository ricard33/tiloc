import React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  InputAdornment, Stack,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Property } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import ImageUploadElement from "../../components/Fields/ImageUploadElement";
import DeleteIcon from "@mui/icons-material/DeleteForever";


type Props = {
  property?: Property;
  onSubmit?: (property: Property) => void;
  onCancel: () => void;
  onDelete?: (property: Property) => void;
};

export const PropertyForm: React.FC<Props> = ({ property, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<Property>({
    defaultValues: property ?? {
      active: true, no_vat: true, vat_rate: 0, invoice_label: "invoice", deposit_label: "deposit",
      note: "", billing: "", payment: "", legal: ""
    }
  });
  const { control, watch } = formContext;
  const { isDirty } = useFormState({ control });
  const no_vat = watch("no_vat", property ? property.no_vat : true);

  usePageUnloadAlert(isDirty);

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  return (
    <FormContainer
      defaultValues={property}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Property properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={property ? property.id : 0} />
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <TextFieldElement name={"name"} label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"email"} type={'email'} label={t("Email")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"phone"} label={t("Phone")} fullWidth required />
            </Grid2>
            {/*<Grid2 sm={6} xs={12}>*/}
            {/*  <TextFieldElement name={"contact"} label={t("Contact")} multiline fullWidth />*/}
            {/*</Grid2>*/}
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"address"} label={t("Address")} multiline rows={3} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"active"} label={t("Active ?")} />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement
                name={"legal"} label={t("Legal mention")} multiline
                fullWidth
                helperText={t("Legal mention on bills")}
              />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement
                name={"payment"} label={t("Payment information")} multiline
                fullWidth
              />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement
                name={"billing"} label={t("Billing information")} multiline
                fullWidth
              />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"no_vat"} label={t("No VAT ?")} />
              <TextFieldElement
                name={"vat_rate"}
                label={t("VAT rate")}
                type={"number"}
                disabled={no_vat}
                validation={{
                  min: 0,
                  max: 100
                }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <SelectElement
                name={"invoice_label"} label={t("Invoice label")} required
                fullWidth
                options={[
                  { id: "invoice", label: t("Invoice") },
                  { id: "note", label: t("Note") },
                  { id: "receipt", label: t("Receipt") },
                  { id: "quittance", label: t("Quittance") }
                ]}
              />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <SelectElement
                name={"deposit_label"} label={t("Deposit label")} required
                fullWidth
                options={[
                  { id: "deposit", label: t("Deposit") },
                  { id: "down_payment", label: t("Down payment") }
                ]}
              />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <ImageUploadElement name="logo" label={t("Logo")} />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <ImageUploadElement
                name="signature" label={t("Signature")}
                helperText={t("Owner signature, used in contracts")}
              />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement name={"note"} label={t("Note")} multiline rows={3} fullWidth />
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && property &&
              <Button
                type="button"
                className="delete-button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(property)}
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
