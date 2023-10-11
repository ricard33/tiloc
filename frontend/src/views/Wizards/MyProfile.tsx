import React, { useState } from "react";
import { Button, Card, CardContent, CardHeader, Unstable_Grid2 as Grid2 } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, PasswordElement, PasswordRepeatElement, TextFieldElement } from "react-hook-form-mui";
import { useForm } from "react-hook-form";
import { User } from "../../types";
import { useUpdateUserMutation } from "../../services/api";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { auth } from "../../actions";
import setDefaults from "../../common/set.defaults";
import { WizardFooter } from "./WizardFooter";


type Props = {
  onBack: () => void;
  onNext: () => void;
  canChangeEmail?: boolean;
  canChangePassword?: boolean;
};

export const MyProfile: React.FC<Props> = (props) => {
  const args = setDefaults<Props>(props, {
    canChangeEmail: true,
    canChangePassword: true
  });
  const { onBack, onNext, canChangePassword, canChangeEmail } = args;

  const { t } = useTranslation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const [updateUser] = useUpdateUserMutation();
  const [changePassword, setChangePassword] = useState(!(currentUser.id));
  // const formContext = useForm<User>({
  //   defaultValues: currentUser
  // });
  // const { handleSubmit } = formContext;
  const { showError, showSuccess } = useAlert();
  const dispatch = useDispatch();

  const onSubmitHandler = (data: User) => {
    console.log(data);
    updateUser({ ...currentUser, ...data }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error during profile update", error);
        showError(t("Impossible to update your profile: ") + fetchErrorDecode(error));
      } else {
        const user = (result as any).data;
        dispatch(auth.userLoaded(user));
        showSuccess(t("Profile updated"));
        onNext();
      }
    });
  };

  function onChangePasswordClick() {
    setChangePassword(true);
  }

  return (
    <FormContainer
      defaultValues={currentUser}
      onSuccess={onSubmitHandler}
      // formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("User")} />
        <CardContent sx={{}}>
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
          </Grid2>
        </CardContent>
      </Card>
      <WizardFooter onBack={onBack} onNext={() => null /*handleSubmit(onSubmitHandler)*/} onSkip={() => null} />
    </FormContainer>
  );
};
