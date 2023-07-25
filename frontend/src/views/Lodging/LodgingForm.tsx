import React from "react";

import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  InputAdornment, Stack,
  Unstable_Grid2 as Grid2
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { FormContainer, SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { useForm, useFormState } from "react-hook-form";
import { Lodging, Property } from "../../types";
import { useUnsavedChangesConfirm } from "../../common/dialogs";
import { usePageUnloadAlert } from "../../common/formUtils";
import { Save as SaveIcon } from "@mui/icons-material";
import RichTextEditorElement from "../../components/Fields/RichTextEditorElement";
import DeleteIcon from "@mui/icons-material/DeleteForever";


type Props = {
  lodging?: Lodging;
  properties: Property[];
  onSubmit?: (lodging: Lodging) => void;
  onCancel: () => void;
  onDelete?: (lodging: Lodging) => void;
};

export const LodgingForm: React.FC<Props> = ({ lodging, properties, onSubmit, onCancel, onDelete }) => {
  const { t } = useTranslation();
  const unsavedChangesConfirm = useUnsavedChangesConfirm();
  const formContext = useForm<Lodging>({ defaultValues: lodging ?? {description: ""}});
  const { control } = formContext;
  const {isDirty} = useFormState({ control });
  usePageUnloadAlert(isDirty);

  const propertiesOptions: { label: string, id: number }[] = properties ? properties.map((property) => {
    return { label: property.name, id: property.id };
  }) : [];


  const onCancelHandler = () => {
    unsavedChangesConfirm()
      .then(() => {
        onCancel();
      });
  };

  // console.log("redraw", dirtyFields, touchedFields);
  return (
    <FormContainer
      defaultValues={lodging}
      onSuccess={onSubmit}
      formContext={formContext}
    >
      <Card sx={{ maxWidth: "800px" }}>
        <CardHeader title={t("Lodging properties")} />
        <CardContent sx={{}}>
          <input type="hidden" name={"id"} value={lodging ? lodging.id : undefined} />
          <input type="hidden" name={"rank"} value={lodging ? lodging.rank : 0} />
          <Grid2 container spacing={4}>
            <Grid2 xs={12}>
              <TextFieldElement name={"name"} label={t("Name")} fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <TextFieldElement name={"address"} label={t("Address")} multiline fullWidth required />
            </Grid2>
            <Grid2 sm={6} xs={12}>
              <SelectElement
                name={"property_id"}
                label={t("Property")}
                options={propertiesOptions}
                fullWidth
              />
              <SwitchElement name={"active"} label={t("Active ?")} />
              <SwitchElement name={"shown"} label={t("Shown ?")} />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement label={t("Capacity")} name={"capacity"} required type={"number"} />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"daily_rate"}
                label={t("Daily rate")}
                type={"number"}
                required
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"guaranty"}
                label={t("Guaranty")}
                type={"number"}
                required
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            <Grid2 sm={3} xs={6}>
              <TextFieldElement
                name={"tourist_tax"}
                label={t("Tourist tax")}
                type={"number"}
                InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
              />
            </Grid2>
            <Grid2 xs={12}>
              <TextFieldElement name={"information"} label={t("Information")} multiline fullWidth />
            </Grid2>
            <Grid2 xs={12}>
              <RichTextEditorElement
                placeholder="Start typing..."
                name="description"
              />
            </Grid2>
          </Grid2>
        </CardContent>
        <CardActions>
          <Stack direction="row" justifyContent="space-between" style={{ width: "100%" }}>
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
