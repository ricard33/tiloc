import React from "react";

import { useNavigate } from "react-router-dom";
import { useUpdateCurrentUserMutation } from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { UserForm } from "./UserForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { auth } from "../../actions";

export function MyProfile() {
  const { t } = useTranslation();
  const [updateUser] = useUpdateCurrentUserMutation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = currentUser.permissions.includes("core.change_user");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const dispatch = useDispatch();


  const onCancel = () => {
    navigate(-1);
  };

  const onSubmit = (data: User) => {
    // console.log(data);
    updateUser({ ...currentUser, ...data }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error during user change", error);
        showError(t("Impossible to modify user: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Profile updated"));
        const user = (result as any).data;
        dispatch(auth.userLoaded(user));
        navigate(-1);
      }
    });
  };

  return (
    <Page>
      <UserForm
        user={currentUser}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        myProfileOnly
      />
    </Page>
  );
}
