import React from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  InputAdornment,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Owner } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import ImageUploadElement from "../../components/Fields/ImageUploadElement";


type Props = {
  owner: Owner;
  onSubmit: (owner: Owner) => void;
  onCancel: () => void;
};

export const OwnerForm: React.FC<Props> = ({ owner, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<Owner>({ defaultValues: owner });
  const { control, watch } = formContext;
  const { isDirty } = useFormState({ control });
  const no_vat = watch("no_vat", owner.no_vat);

  usePageUnloadAlert(isDirty);

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };


  return (
    <FormContainer
      defaultValues={owner}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Owner properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={owner!.id} />
          <Grid2 container spacing={2}>
            <Grid2 xs={12}>
              <TextFieldElement name={"name"} label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"email"} label={t("Email")} fullWidth required />
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
