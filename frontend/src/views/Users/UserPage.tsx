import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateUserMutation,
  useDeleteUserMutation,
  useGetUserQuery,
  useUpdateUserMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { UserForm } from "./UserForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { User } from "../../types";
import { useConfirm } from "../../libs/MuiConfirm";

export function UserPage() {
  const { t } = useTranslation();
  let { userId } = useParams();
  const {
    data: user,
    isLoading
  } = useGetUserQuery(Number(userId), { skip: typeof userId === "undefined" });
  const [createUser] = useCreateUserMutation();
  const [updateUser] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = currentUser.permissions.includes("core.change_user");
  const canDelete = currentUser.permissions.includes("core.delete_user");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();


  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (user: User) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete user: {{ name }}", {
        name: `${user.full_name} <${user.email}>`
      }),
      description: t("Do you really want to permanently delete this user?")
    })
      .then(() => {
        return deleteUser(user).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting user", error);
            showError(t("Impossible to delete the user: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("User deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: User) => {
    // console.log(data);
    if (!user || !user.id) {
      createUser(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during user creation", error);
          showError(t("Impossible to create user: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("User added"));
          navigate(-1);
        }
      });
    } else {
      updateUser({ ...user, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during user change", error);
          showError(t("Impossible to modify user: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("User changed"));
          navigate(-1);
        }
      });
    }
  };

  if (isLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <UserForm
        user={user}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  );
}
