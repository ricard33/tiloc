import React, { useState } from "react";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  InputAdornment, Stack, Typography,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  FormContainer,
  PasswordElement,
  PasswordRepeatElement,
  SelectElement,
  SwitchElement,
  TextFieldElement
} from "react-hook-form-mui";
import { useForm, useFormContext, useFormState } from "react-hook-form";
import { User } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import ImageUploadElement from "../../components/Fields/ImageUploadElement";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import { useSelector } from "react-redux";
import { RootState } from "../../store";


type Props = {
  canChangeEmail: boolean;
  canChangePassword: boolean;
};

export const MyProfileFormContent: React.FC<Props> = ({canChangeEmail, canChangePassword}) => {
  const { t } = useTranslation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const formContext = useFormContext();
  const { watch, getValues } = formContext;
  // const no_vat = watch("no_vat", property ? property.no_vat : true);
  const no_vat = watch("no_vat", getValues("no_vat"));
  const [changePassword, setChangePassword] = useState(!(currentUser.id));

  function onChangePasswordClick() {
    setChangePassword(true);
  }

  return (
    <>
      <input type="hidden" name={"id"} value={currentUser.id} />
      <Grid2 container spacing={2}>
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"first_name"} label={t("First name")} fullWidth required />
        </Grid2>
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"last_name"} label={t("Last name")} fullWidth required />
        </Grid2>
        <Grid2 xs={12}>
          <TextFieldElement
            name={"email"} type={"email"} label={t("Email")}
            fullWidth required autoComplete="email"
            disabled={!canChangeEmail}
          />
        </Grid2>
        {canChangePassword && (
          changePassword
            ? (
              <>
                <Grid2 sm={6} xs={12}>
                  <PasswordElement
                    name={"password"} label={t("Password")} fullWidth
                    autoComplete="new-password"
                    required
                    validation={{
                      minLength: {
                        value: 8,
                        message: t("Password must have at least 8 characters")
                      }
                    }}
                  />
                </Grid2>
                <Grid2 sm={6} xs={12}>
                  <PasswordRepeatElement
                    passwordFieldName={"password"} name={"password-repeat"}
                    autoComplete="new-password"
                    label={t("Re-type the password")} fullWidth required
                  />
                </Grid2>
              </>)
            :
            <Button onClick={() => onChangePasswordClick()}>{t("Change password")}</Button>
        )}
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"phone"} label={t("Phone")} fullWidth required />
        </Grid2>
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"address"} label={t("Address")} multiline rows={3} fullWidth required />
        </Grid2>
        <Grid2 xs={12}>
          <Typography variant="h6">{t("Contracts")}</Typography>
        </Grid2>
        <Grid2 xs={12}>
          <TextFieldElement
            name={"payment"} label={t("Payment information")} multiline
            fullWidth
            helperText={t("How do you want to be paid (bank transfer, credit card, etc...). You can add your account number.")}
          />
        </Grid2>
        {/*<Grid2 xs={12}>*/}
        {/*  <TextFieldElement*/}
        {/*    name={"legal"} label={t("Legal mention")} multiline*/}
        {/*    fullWidth*/}
        {/*    helperText={t("Legal mention on bills")}*/}
        {/*  />*/}
        {/*</Grid2>*/}
        {/*<Grid2 xs={12}>*/}
        {/*  <TextFieldElement*/}
        {/*    name={"billing"} label={t("Billing information")} multiline*/}
        {/*    fullWidth*/}
        {/*  />*/}
        {/*</Grid2>*/}
        {/*<Grid2 sm={6} xs={12}>*/}
        {/*  <SwitchElement name={"no_vat"} label={t("No VAT ?")} />*/}
        {/*  <TextFieldElement*/}
        {/*    name={"vat_rate"}*/}
        {/*    label={t("VAT rate")}*/}
        {/*    type={"number"}*/}
        {/*    disabled={no_vat}*/}
        {/*    validation={{*/}
        {/*      min: 0,*/}
        {/*      max: 100*/}
        {/*    }}*/}
        {/*    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}*/}
        {/*  />*/}
        {/*</Grid2>*/}
        {/*<Grid2 sm={6} xs={12}>*/}
        {/*</Grid2>*/}
        <Grid2 sm={6} xs={12}>
          <ImageUploadElement name="logo" label={t("Logo")} />
        </Grid2>
        <Grid2 sm={6} xs={12}>
          <ImageUploadElement
            name="signature" label={t("Signature")}
            helperText={t("Owner signature, used in contracts")}
          />
        </Grid2>
      </Grid2>
    </>
  );
};
