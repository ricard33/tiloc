import React from "react";
import { Button, Card, CardActions, CardContent, CardHeader, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { User } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import { UserFormContent } from "./UserFormContent";


type Props = {
  user?: User;
  onSubmit?: (user: User) => void;
  onCancel: () => void;
  onDelete?: (user: User) => void;
};

export const UserForm: React.FC<Props> = ({ user, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<User>({
    defaultValues: user ?? {
      is_active: true,
      groups: ["standard"]
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
          <UserFormContent canChangeEmail canChangePassword myProfileOnly={false}/>
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
