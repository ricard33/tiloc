import React, { useState } from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Stack, Unstable_Grid2 as Grid2 } from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  FormContainer,
  PasswordElement,
  PasswordRepeatElement,
  SwitchElement,
  TextFieldElement
} from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { User } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";


type Props = {
  user?: User;
  onSubmit?: (user: User) => void;
  onCancel: () => void;
  onDelete?: (user: User) => void;
};

export const UserForm: React.FC<Props> = ({ user, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const [changePassword, setChangePassword] = useState(!(user && user.id));
  const formContext = useForm<User>({
    defaultValues: user ?? {
      is_active: true
    }
  });
  const { control } = formContext;
  const { isDirty } = useFormState({ control });

  usePageUnloadAlert(isDirty);

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  function onChangePasswordClick() {
    setChangePassword(true);
  }

  return (
    <FormContainer
      defaultValues={user}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("User")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={user ? user.id : 0} />
          <Grid2 container spacing={2}>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"first_name"} label={t("First name")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"last_name"} label={t("Last name")} fullWidth required />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement name={"email"} type={"email"} label={t("Email")} fullWidth required />
            </Grid2>
            {changePassword
              ? (
                <>
                  <Grid2 sm={6} xs={12}>
                    <PasswordElement
                      name={"password"} label={t("Password")} fullWidth
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
                      label={t("Re-type the password")} fullWidth required
                    />
                  </Grid2>
                </>)
              :
              <Button onClick={() => onChangePasswordClick()}>{t("Change password")}</Button>
            }
            <Grid2 sm={6} xs={12}>
              <SwitchElement name={"is_active"} label={t("Active ?")} />
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
            {onDelete && user &&
              <Button
                type="button"
                className="delete-button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(user)}
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
