import React, { useState } from "react";
import { Button, Tooltip, Typography, Unstable_Grid2 as Grid2 } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  MultiSelectElement,
  PasswordElement,
  PasswordRepeatElement,
  SwitchElement,
  TextFieldElement
} from "react-hook-form-mui";
import { useFormContext } from "react-hook-form";
import ImageUploadElement from "../../components/Fields/ImageUploadElement";
import { useListLodgingsQuery, useResendVerificationMutation } from "../../services/api";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import UnverifiedUserIcon from "@mui/icons-material/GppMaybe";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";

type Props = {
  canChangeEmail: boolean;
  canChangePassword: boolean;
  myProfileOnly: boolean;
};

export const UserFormContent: React.FC<Props> = ({ canChangeEmail, canChangePassword, myProfileOnly }) => {
  const { t } = useTranslation();
  const formContext = useFormContext();
  const { data: lodgings } = useListLodgingsQuery();
  const { watch, getValues } = formContext;
  // const no_vat = watch("no_vat", property ? property.no_vat : true);
  const userId = watch("id", getValues("id"));
  // const no_vat = watch("no_vat", getValues("no_vat"));
  const [changePassword, setChangePassword] = useState(!(userId));
  const isVerified = getValues("verified");
  const [resendVerification] = useResendVerificationMutation();
  const { showError, showSuccess } = useAlert();

  function onChangePasswordClick() {
    setChangePassword(true);
  }

  function onResendVerification() {
    resendVerification().then(result => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error while trying to resend verification", error);
        showError(t("Impossible resend verification email: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Verification email sent"));
      }

    });
  }

  return (
    <>
      <input type="hidden" name={"id"} value={userId} />
      <Grid2 container spacing={2}>
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"first_name"} label={t("First name")} fullWidth required />
        </Grid2>
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"last_name"} label={t("Last name")} fullWidth required />
        </Grid2>
        <Grid2 sm={8} xs={12}>
          <TextFieldElement
            name={"email"} type={"email"} label={t("Email")}
            fullWidth required autoComplete="email"
            disabled={!canChangeEmail}
          />
        </Grid2>
        <Grid2 sm={4} xs={12}>
          {isVerified ?
            <Tooltip title={t("Email verified")}>
              <VerifiedUserIcon color="success" />
            </Tooltip>
            :
            <Tooltip title={t("Email not verified")}>
              <>
                <UnverifiedUserIcon color="warning" />
                <Button onClick={() => onResendVerification()}>{t("Resend verification email")}</Button>
              </>
            </Tooltip>
          }
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
            <Grid2 xs={12}>
              <Button onClick={() => onChangePasswordClick()}>{t("Change password")}</Button>
            </Grid2>
        )}
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"phone"} label={t("Phone")} fullWidth />
        </Grid2>
        <Grid2 sm={6} xs={12}>
          <TextFieldElement name={"address"} label={t("Address")} multiline rows={3} fullWidth />
        </Grid2>

        {!myProfileOnly && (
          <>
            <Grid2 xs={12}>
              <Typography variant="h6">{t("Permissions")}</Typography>
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"is_active"} label={t("Active ?")} />
            </Grid2>
            <Grid2 xs={12}>
              <MultiSelectElement
                label={t("User type")}
                name="groups"
                options={[
                  { id: "administrator", label: t("administrator") },
                  { id: "standard", label: t("standard") },
                  { id: "external", label: t("external") },
                  { id: "readonly", label: t("readonly") }
                ]}
                showChips
              />
            </Grid2>
            <Grid2 xs={12}>
              <MultiSelectElement
                label={t("Owned lodgings")}
                name="lodgings"
                options={lodgings ? lodgings.map(l => {
                  return { id: l.name, label: l.name };
                }) : []}
                showChips
              />
            </Grid2>
          </>
        )}
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
