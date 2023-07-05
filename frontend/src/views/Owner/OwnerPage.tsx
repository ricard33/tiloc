import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateOwnerMutation, useDeleteOwnerMutation,
  useGetOwnerQuery,
  useUpdateOwnerMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { OwnerForm } from "./OwnerForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Owner, User } from "../../types";
import { useConfirm } from "../../libs/MuiConfirm";

export function OwnerPage() {
  const { t } = useTranslation();
  let { ownerId } = useParams();
  const {
    data: owner,
    isLoading
  } = useGetOwnerQuery(Number(ownerId), { skip: typeof ownerId === "undefined" });
  const [createOwner] = useCreateOwnerMutation();
  const [updateOwner] = useUpdateOwnerMutation();
  const [deleteOwner] = useDeleteOwnerMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_owner");
  const canDelete = user.permissions.includes("core.delete_owner");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();


  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (owner: Owner) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete owner: {{ name }}", {
        name: owner.name,
      }),
      description: t("Do you really want to permanently delete this owner?")
    })
      .then(() => {
        return deleteOwner(owner.id).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting owner", error);
            showError(t("Impossible to delete the owner: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Owner deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: Owner) => {
    // console.log(data);
    if(!owner || !owner.id) {
      createOwner(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during owner creation", error);
          showError(t("Impossible to create owner: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Owner added"));
          navigate(-1)
        }
      });
    } else {
      updateOwner({ ...owner, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during owner change", error);
          showError(t("Impossible to modify owner: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Owner changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <OwnerForm
        owner={owner}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  )
  ;
}
