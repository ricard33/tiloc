import React from "react";
import { Card, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer } from "react-hook-form-mui";
import { User } from "../../types";
import { useUpdateUserMutation } from "../../services/api";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { auth } from "../../actions";
import setDefaults from "../../common/set.defaults";
import { WizardFooter } from "./WizardFooter";
import { UserFormContent } from "../Users/UserFormContent";


type Props = {
  onNext: () => void;
  canChangeEmail?: boolean;
  canChangePassword?: boolean;
};

export const UserProfileWizardStep: React.FC<Props> = (props) => {
  const args = setDefaults<Props>(props, {
    canChangeEmail: true,
    canChangePassword: true
  });
  const { onNext, canChangePassword, canChangeEmail } = args;

  const { t } = useTranslation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const [updateUser] = useUpdateUserMutation();
  const { showError, showSuccess } = useAlert();
  const dispatch = useDispatch();

  const onSubmitHandler = (data: User) => {
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


  return (
    <FormContainer
      defaultValues={currentUser}
      onSuccess={onSubmitHandler}
      // formContext={formContext}
    >
      <Card sx={{ maxWidth: "none" }}>
        <CardHeader title={t("User")} />
        <CardContent sx={{}}>
          <UserFormContent canChangeEmail={canChangeEmail} canChangePassword={canChangePassword} myProfileOnly isSetupWizard />
        </CardContent>
      </Card>
      <WizardFooter />
    </FormContainer>
  );
};
