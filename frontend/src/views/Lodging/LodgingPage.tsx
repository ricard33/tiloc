// @ts-nocheck
import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateLodgingMutation,
  useGetLodgingQuery,
  useListOwnersQuery,
  useUpdateLodgingMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { LodgingForm } from "./LodgingForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";

export function LodgingPage() {
  const { t } = useTranslation();
  let { lodgingId } = useParams();
  const {
    data: lodging,
    isLoading
  } = useGetLodgingQuery(Number(lodgingId), { skip: typeof lodgingId === "undefined" });
  const [createLodging] = useCreateLodgingMutation();
  const [updateLodging] = useUpdateLodgingMutation();
  const { data: owners, isLoading: isOwnerLoading } = useListOwnersQuery();
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();


  const onCancel = () => {
    navigate(-1);
  };

  const onSubmit = (data) => {
    console.log(data);
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
          console.error("Error during payment change", error);
          showError(t("Impossible to modify lodging: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Lodging changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading || isOwnerLoading) return <div>Loading...</div>;
  return (
    <Page>
      <LodgingForm lodging={lodging} owners={owners} onSubmit={onSubmit} onCancel={onCancel} />
    </Page>
  )
  ;
}
