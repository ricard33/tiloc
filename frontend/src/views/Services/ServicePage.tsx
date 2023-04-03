import React from "react";

import { useNavigate, useParams } from "react-router-dom";
import {
  useCreateServiceMutation, useDeleteServiceMutation,
  useGetServiceQuery,
  useUpdateServiceMutation
} from "../../services/api";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { ServiceForm } from "./ServiceForm";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useConfirm } from "../../libs/MuiConfirm";
import { Service, User } from "../../types";

export function ServicePage() {
  const { t } = useTranslation();
  let { serviceId } = useParams();
  console.log("serviceId", serviceId, typeof serviceId)
  const {
    data: service,
    isLoading
  } = useGetServiceQuery(Number(serviceId), { skip: typeof serviceId === "undefined" });
  const [createService] = useCreateServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [deleteService] = useDeleteServiceMutation();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canChange = user.permissions.includes("core.change_service");
  const canDelete = user.permissions.includes("core.delete_service");
  const { showError, showSuccess } = useAlert();
  const navigate = useNavigate();
  const confirm = useConfirm();


  const onCancel = () => {
    navigate(-1);
  };

  const onDelete = async (service: Service) => {
    if (!canDelete) return await Promise.resolve();
    return confirm({
      title: t("Delete service: {{ name }}", {
        name: service.designation,
      }),
      description: t("Do you really want to permanently delete this service?")
    })
      .then(() => {
        return deleteService(service.id).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting service", error);
            showError(t("Impossible to delete the service: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Service deleted"));
            navigate(-1);
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  const onSubmit = (data: Service) => {
    // console.log(data);
    if(!service || !service.id) {
      createService(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during service creation", error);
          showError(t("Impossible to create service: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Service added"));
          navigate(-1)
        }
      });
    } else {
      updateService({ ...service, ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during payment change", error);
          showError(t("Impossible to modify service: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Service changed"));
          navigate(-1)
        }
      });
    }
  };

  if (isLoading) return <div>Loading...</div>;
  return (
    <Page>
      <ServiceForm
        service={service}
        onSubmit={canChange ? onSubmit : undefined} onCancel={onCancel}
        onDelete={canDelete ? onDelete : undefined}
      />
    </Page>
  )
  ;
}
