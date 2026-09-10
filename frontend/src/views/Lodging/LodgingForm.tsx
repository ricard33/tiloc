import React from "react";

import { Button, Card, CardActions, CardContent, CardHeader, Stack } from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Lodging, User } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/DeleteForever";
import { LodgingFormContent } from "./LodgingFormContent";
import { useSelector } from "react-redux";
import { RootState } from "../../store";


type Props = {
  lodging?: Lodging;
  users: User[];
  onSubmit?: (lodging: Lodging) => void;
  onCancel: () => void;
  onDelete?: (lodging: Lodging) => void;
};

export const LodgingForm: React.FC<Props> = ({ lodging, users, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const currentUser = useSelector<RootState>(store => store.auth.user) as User;
  const defaultValues = lodging ? {
    ...lodging,
    remote_calendars: undefined  // remove this field
  } : {
    description: "",
    tourist_tax_included_in_payment: true,
    active: true,
    shown: true,
    owner_id: currentUser.id,
    address: currentUser.address,
    deposit_label: "deposit",
    deposit_percent: 30,
    min_nights: 1,
    season_calendar: ""
  } as unknown as Lodging;
  const formContext = useForm<Lodging>({
    defaultValues: defaultValues
  });
  const { control } = formContext;
  const { isDirty } = useFormState({ control });
  usePageUnloadAlert(isDirty);

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  // console.log("redraw", isDirty, dirtyFields, touchedFields);
  // console.log("isDirty: ", isDirty, dirtyFields);
  // console.log("defaultValues: ", defaultValues);
  // console.log("values: ", getValues());
  // console.log("DIFF", filterObject(deepDiffMapper.map(defaultValues, getValues()),
  //   (value) => value?.type !== "unchanged"));

  return (
    <FormContainer
      defaultValues={lodging}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Lodging properties")} />
        <CardContent sx={{}}>
          <LodgingFormContent lodging={lodging} users={users} />
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }} margin={2}>
            {onDelete && lodging &&
              <Button
                type="button"
                className="delete-button"
                sx={{ color: "red" }}
                color="secondary"
                startIcon={<DeleteIcon />}
                onClick={() => onDelete(lodging)}
              >{t("Delete")}</Button>
            }
            {isDirty && onSubmit ?
              <>
                <Button color={"secondary"} onClick={() => onCancelHandler()}>{t("Cancel")}</Button>
                <Button type={"submit"} color={"primary"} startIcon={<SaveIcon />}>{t("Save")}</Button>
              </> :
              <Button onClick={() => onCancel()} color={"primary"}>{t("Close")}</Button>
            }
          </Stack>
        </CardActions>
      </Card>
    </FormContainer>
  );
};
