import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreatePropertyMutation, useDeletePropertyMutation,
  useGetPropertyQuery,
  useUpdatePropertyMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { PropertyForm } from "./PropertyForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { Property, User } from "../../types";
import { useConfirm } from "../../libs/MuiConfirm";

export function PropertyPage() {
  const { t } = useTranslation();
  let { propertyId } = useParams();
  const {
    data: property,
    isLoading
  } = useGetPropertyQuery(Number(propertyId), { skip: typeof propertyId === "undefined" });
  const [createProperty] = useCreatePropertyMutation();
  const [updateProperty] = useUpdatePropertyMutation();
  const [deleteProperty] = useDeletePropertyMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_property");
  const canDelete = user.permissions.includes("core.delete_property");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();


  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (property: Property) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete property: {{ name }}", {
        name: property.name,
      }),
      description: t("Do you really want to permanently delete this property?")
    })
      .then(() => {
        return deleteProperty(property.id).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting property", error);
            showError(t("Impossible to delete the property: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Property deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: Property) => {
    // console.log(data);
    if(!property || !property.id) {
      createProperty(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during property creation", error);
          showError(t("Impossible to create property: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Property added"));
          navigate(-1)
        }
      });
    } else {
      updateProperty({ ...property, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during property change", error);
          showError(t("Impossible to modify property: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Property changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading) return <div>{t("Loading...")}</div>;
  return (
    <Page>
      <PropertyForm
        property={property}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  )
  ;
}
