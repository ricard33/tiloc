import React  from "react";

import { Button, Card, CardActions, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";
import InputAdornment from "@mui/material/InputAdornment";
import Grid2 from "@mui/material/Unstable_Grid2";
import { FormContainer, SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Lodging, Owner } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";

type Props = {
  lodging: Lodging;
  owners: Owner[];
  onSubmit: (lodging: Lodging) => void;
  onCancel: () => void;
};

export const LodgingForm: React.FC<Props> = ({ lodging, owners, onSubmit, onCancel }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<Lodging>({
    defaultValues: lodging
  });
  const { control } = formContext;
  const { dirtyFields } = useFormState({
    control
  });
  usePageUnloadAlert(() => Object.keys(dirtyFields).length > 0);

  const ownersOptions: { label: string, id: number }[] = owners ? owners.map((owner) => {
    return { label: owner.name, id: owner.id };
  }) : [];


  // useEffect(() => {
  //   const unloadCallback = (event: { preventDefault: () => void; returnValue: string; }) => {
  //     if (Object.keys(dirtyFields).length > 0) {
  //       event.preventDefault();
  //       event.returnValue = "";
  //       return "";
  //     }
  //   };
  //
  //   window.addEventListener("beforeunload", unloadCallback);
  //   return () => window.removeEventListener("beforeunload", unloadCallback);
  // }, [dirtyFields]);

  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  const onModifyDescription = () => {

  };

  return (
    <FormContainer
      defaultValues={lodging}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Lodging properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={lodging!.id} />
          <Grid2 container spacing={4}>
            <Grid2 xs={12}>
              <TextFieldElement name={"name"} label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"address"} label={t("Address")} multiline fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SelectElement
                name={"owner"}
                label={t("Owner")}
                options={ownersOptions}
                fullWidth
              />
              <SwitchElement name={"active"} label={t("Active ?")} />
              <SwitchElement name={"shown"} label={t("Shown ?")} />
              <input type="hidden" name={"rank"} value={lodging!.rank} />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement label={"Capacity"} name={"capacity"} required type={"number"} />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"daily_rate"}
                label={"Daily rate"}
                type={"number"}
                required
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"guaranty"}
                label={"Guaranty"}
                type={"number"}
                required
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"tourist_tax"}
                label={"Tourist tax"}
                type={"number"}
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement name={"information"} label={t("Information")} multiline fullWidth />
            </Grid2>
            <Grid2 xs={12}>
              <Button
                variant="contained" color={"secondary"}
                onClick={() => onModifyDescription()}
              >{t("Modify description")}</Button>
              {/*  <MUIRichTextEditor*/}
              {/*    defaultValue={description}*/}
              {/*    label="Start typing..."*/}
              {/*  />*/}
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end"
          }}
        >
          {Object.keys(dirtyFields).length > 0 ?
            <>
              <Button color={"secondary"} onClick={() => onCancelHandler()}>{t("Cancel")}</Button>
              <Button type={"submit"} color={"primary"}>{t("Save")}</Button>
            </> :
            <Button onClick={() => onCancel()} color={"primary"}>{t("Close")}</Button>
          }
        </CardActions>
      </Card>
    </FormContainer>
  );
};
