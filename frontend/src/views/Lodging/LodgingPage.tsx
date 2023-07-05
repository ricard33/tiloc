import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateLodgingMutation, useDeleteLodgingMutation,
  useGetLodgingQuery,
  useListOwnersQuery,
  useUpdateLodgingMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { LodgingForm } from "./LodgingForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { Lodging, User } from "../../types";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useConfirm } from "../../libs/MuiConfirm";

export function LodgingPage() {
  const { t } = useTranslation();
  let { lodgingId } = useParams();
  const {
    data: lodging,
    isLoading
  } = useGetLodgingQuery(Number(lodgingId), { skip: typeof lodgingId === "undefined" });
  const [createLodging] = useCreateLodgingMutation();
  const [updateLodging] = useUpdateLodgingMutation();
  const [deleteLodging] = useDeleteLodgingMutation();
  const { data: owners, isLoading: isOwnerLoading } = useListOwnersQuery();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_lodging");
  const canDelete = user.permissions.includes("core.delete_lodging");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();


  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (lodging: Lodging) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete lodging: {{ name }}", {
        name: lodging.name,
      }),
      description: t("Do you really want to permanently delete this lodging?")
    })
      .then(() => {
        return deleteLodging(lodging.id).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting lodging", error);
            showError(t("Impossible to delete the lodging: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Lodging deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: Lodging) => {
    // console.log(data);
    if(!lodging || !lodging.id) {
      createLodging(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during lodging creation", error);
          showError(t("Impossible to create lodging: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Lodging added"));
          navigate(-1)
        }
      });
    } else {
      updateLodging({ ...lodging, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during lodging change", error);
          showError(t("Impossible to modify lodging: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Lodging changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading || isOwnerLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <LodgingForm
        lodging={lodging} owners={owners ?? []}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  )
  ;
}
