// @ts-nocheck
import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateOwnerMutation,
  useGetOwnerQuery,
  useListOwnersQuery,
  useUpdateOwnerMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { OwnerForm } from "./OwnerForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";

export function OwnerPage() {
  const { t } = useTranslation();
  let { ownerId } = useParams();
  const {
    data: owner,
    isLoading
  } = useGetOwnerQuery(Number(ownerId), { skip: typeof ownerId === "undefined" });
  const [createOwner] = useCreateOwnerMutation();
  const [updateOwner] = useUpdateOwnerMutation();
  const { data: owners, isLoading: isOwnerLoading } = useListOwnersQuery();
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();


  const onCancel = () => {
    navigate(-1);
  };

  const onSubmit = (data) => {
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
          console.error("Error during payment change", error);
          showError(t("Impossible to modify owner: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Owner changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading || isOwnerLoading) return <div>Loading...</div>;
  return (
    <Page>
      <OwnerForm owner={owner} owners={owners} onSubmit={onSubmit} onCancel={onCancel} />
    </Page>
  )
  ;
}
