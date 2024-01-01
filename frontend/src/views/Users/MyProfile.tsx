import React from "react";

import { useNavigate } from "react-router-dom";
import { useUpdateCurrentUserMutation } from "../../services/api";
import { useTranslation } from "react-i18next";
import { UserForm } from "./UserForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useDispatch } from "react-redux";
import { Account, User } from "../../types";
import { auth } from "../../actions";
import { useAppSelector } from "../../app/hooks";

export function MyProfile() {
  const { t } = useTranslation();
  const [updateUser] = useUpdateCurrentUserMutation();
  const currentUser = useAppSelector(store => store.auth.user) as User;
  const account = useAppSelector(store => store.auth.account) as Account;
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
        dispatch(auth.userLoaded({ ...user, account }));
        navigate(-1);
      }
    });
  };

  return (
    <UserForm
      user={currentUser}
      onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
      myProfileOnly
    />
  );
}
