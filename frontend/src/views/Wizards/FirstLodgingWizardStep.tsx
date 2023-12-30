import React from "react";
import { Card, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer } from "react-hook-form-mui";
import { Lodging, User } from "../../types";
import { LodgingFormContent } from "../Lodging/LodgingFormContent";
import { WizardFooter } from "./WizardFooter";
import { fetchErrorDecode } from "../../common/apiUtils";
import {
  useCreateLodgingMutation,
  useListLodgingsQuery,
  useListUsersQuery,
  useUpdateLodgingMutation
} from "../../services/api";
import { useAlert } from "../../common/alertUtils";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { auth } from "../../actions";


type Props = {
  onNext: () => void;
};

export const FirstLodgingWizardStep: React.FC<Props> = ({ onNext }) => {
  const { t } = useTranslation();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const defaultValues: Partial<Lodging> = {
    active: true, shown: true, owner_id: currentUser.id, address: currentUser.address,
    description: "", tourist_tax_included_in_payment: true, deposit_label: "deposit", deposit_percent: 30,
  };
  const { data: lodgings, isLoading } = useListLodgingsQuery({}, { refetchOnMountOrArgChange: 20 });
  const { data: users, isLoading: isLoadingUsers } = useListUsersQuery();
  const [createLodging] = useCreateLodgingMutation();
  const [updateLodging] = useUpdateLodgingMutation();
  const { showError, showSuccess } = useAlert();
  const dispatch = useDispatch();

  const onSubmitHandler = (data: Lodging) => {
    // console.log(data);
    if(typeof lodgings === "undefined" || lodgings.length === 0) {
      createLodging(data).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during lodging creation", error);
          showError(t("Impossible to create lodging: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Lodging added"));
          dispatch(auth.needToReloadUser());
          onNext();
        }
      });
    } else {
      updateLodging({ ...lodgings[0], ...data }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during lodging change", error);
          showError(t("Impossible to modify lodging: ") + fetchErrorDecode(error));
        } else {
          showSuccess(t("Lodging changed"));
          onNext();
        }
      });
    }
  };

  if(isLoading || isLoadingUsers) return <div>{t("Loading...")}</div>
  return (
    <FormContainer
      defaultValues={lodgings && lodgings.length > 0 ? lodgings[0] : defaultValues}
      onSuccess={onSubmitHandler}
    >
      <Card sx={{ maxWidth: "none" }}>
        <CardHeader title={t("Lodging properties")} />
        <CardContent sx={{}}>
          <LodgingFormContent users={users ?? []} isSetupWizard />
        </CardContent>
      </Card>
      <WizardFooter />
    </FormContainer>
  );
};
