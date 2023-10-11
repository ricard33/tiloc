import React from "react";
import { Card, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer } from "react-hook-form-mui";
import { Property, User } from "../../types";
import { PropertyFormContent } from "../Property/PropertyFormContent";
import { WizardFooter } from "./WizardFooter";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useCreatePropertyMutation, useListPropertiesQuery, useUpdatePropertyMutation } from "../../services/api";
import { useAlert } from "../../common/alertUtils";
import { useSelector } from "react-redux";
import { RootState } from "../../store";


type Props = {
  onBack: () => void;
  onNext: () => void;
};

export const FirstPropertyForm: React.FC<Props> = ({ onBack, onNext }) => {
  const { t } = useTranslation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const defaultValues = {
    active: true, no_vat: true, vat_rate: 0, invoice_label: "invoice", deposit_label: "deposit",
    contractual_name: `${currentUser.first_name} ${currentUser.last_name}`,
    note: "", billing: "", payment: "", legal: ""
  };
  const { data: properties, isLoading } = useListPropertiesQuery({}, { refetchOnMountOrArgChange: 20 });
  const [createProperty] = useCreatePropertyMutation();
  const [updateProperty] = useUpdatePropertyMutation();
  const { showError, showSuccess } = useAlert();

  const onSubmitHandler = (data: Property) => {
    // console.log(data);
    if(typeof properties === "undefined" || properties.length === 0) {
      createProperty(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during property creation", error);
          showError(t("Impossible to create property: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Property added"));
          onNext();
        }
      });
    } else {
      updateProperty({ ...properties[0], ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during property change", error);
          showError(t("Impossible to modify property: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Property changed"));
          onNext();
        }
      });
    }
  };
  const onSubmitHandler_ = (data: Property) => {
    // console.log(data);
    createProperty(data).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error during property creation", error);
        showError(t("Impossible to create property: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Property added"));
        onNext();
      }
    });
  };

  if(isLoading) return <div>{t("Loading...")}</div>
  console.log(properties);
  console.log(properties && properties.length > 0 ? properties[0] : defaultValues);
  return (
    <FormContainer
      defaultValues={properties && properties.length > 0 ? properties[0] : defaultValues}
      onSuccess={onSubmitHandler}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Property properties")} />
        <CardContent sx={{}}>
          <PropertyFormContent />
        </CardContent>
      </Card>
      <WizardFooter onBack={onBack} onNext={() => null} onSkip={() => null} />
    </FormContainer>
  );
};
