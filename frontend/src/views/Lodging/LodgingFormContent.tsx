import React from "react";

import { InputAdornment, Typography, Unstable_Grid2 as Grid2 } from "@mui/material";
import { useTranslation } from "react-i18next";
import { SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";
import { Lodging, User } from "../../types";
import RichTextEditorElement from "../../components/Fields/RichTextEditorElement";
import { useFormContext } from "react-hook-form";


type Props = {
  lodging?: Lodging;
  users: User[];
};

export const LodgingFormContent: React.FC<Props> = ({ lodging, users }) => {
  const { t } = useTranslation();
  const formContext = useFormContext();
  const { watch, getValues } = formContext;
  const isFlatRateTourismTax = watch("is_flat_rate_tourist_tax", getValues("is_flat_rate_tourist_tax"));

  const usersOptions: { label: string, id: number }[] = users ? users.map((user) => {
    return { label: user.full_name, id: user.id };
  }) : [];

  console.log(isFlatRateTourismTax);
  return (
    <>
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
            name={"owner_id"} label={t("Owner")} options={usersOptions}
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
            name={"daily_rate"} label={t("Daily rate")} type={"number"}
            required
            InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
          />
        </Grid2>
        <Grid2 sm={3} xs={6}>
          <TextFieldElement
            name={"guaranty"} label={t("Guaranty")} type={"number"}
            required
            InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
          />
        </Grid2>
        <Grid2 xs={12} container>
          <Grid2 xs={4}>
            <SwitchElement name={"is_flat_rate_tourist_tax"} label={t("Is the tourist tax flat rate?")} />
          </Grid2>
          {/*<Grid2 xs={6}>*/}
          {/*  <SwitchElement name={"tourist_tax_included_in_payment"} label={t("Should include tourist tax in payment?")} />*/}
          {/*</Grid2>*/}
          <Grid2 xs={4}>
            <TextFieldElement
              name={"max_daily_tourist_tax"}
              label={isFlatRateTourismTax ? t("Daily tourist tax") : t("Ceiling of your daily tax")}
              type={"number"}
              InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
            />
          </Grid2>
          <Grid2 xs={4}>
            {!isFlatRateTourismTax &&
              <TextFieldElement
                name={"tourist_tax_rate"} label={t("Rate of your daily tax")} type={"number"}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />}
          </Grid2>
        </Grid2>
        <Grid2 xs={12}>
          <TextFieldElement
            name={"information"} label={t("Information")} multiline
            helperText={t("Private notes about this lodging")}
            fullWidth
          />
        </Grid2>
        <Grid2 xs={12}>
          <Typography variant="h6">{t("Lodging description (annexed to contracts)")}</Typography>
        </Grid2>
        <Grid2 xs={12}>
          <RichTextEditorElement placeholder="Start typing..." name="description" />
        </Grid2>
      </Grid2>
    </>
  );
};
