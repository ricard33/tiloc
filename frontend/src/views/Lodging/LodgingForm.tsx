import React from "react";

import { useParams } from "react-router-dom";
import { useGetLodgingQuery, useListOwnersQuery } from "../../services/api";
import Page from "../../layouts/Main/Page";
import { Button, Card, CardActions, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";
import InputAdornment from "@mui/material/InputAdornment";
import Grid2 from "@mui/material/Unstable_Grid2";
import { FormContainer, SelectElement, SwitchElement, TextFieldElement } from "react-hook-form-mui";

export function LodgingForm() {
  const { t } = useTranslation();
  let { lodgingId } = useParams();
  const {
    data: lodging,
    isLoading
  } = useGetLodgingQuery(Number(lodgingId), { skip: typeof lodgingId === "undefined" });
  const { data: owners } = useListOwnersQuery();

  const ownersOptions: { label: string, id: number }[] = owners ? owners.map((owner, index) => {
    return { label: owner.name, id: owner.id };
  }) : [];

  if (isLoading) return <div>Loading...</div>;
  return (
    <Page>
      <FormContainer
        defaultValues={lodging}
        onSuccess={(data) => {
          console.log(data);
        }}
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
              {/*<Grid2 xs={12}>*/}
              {/*  <AutoField name={"description"} />*/}
              {/*</Grid2>*/}
            </Grid2>
          </CardContent>
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "flex-end"
            }}
          >
            <Button color={"secondary"}>{t("Cancel")}</Button>
            <Button type={"submit"} color={"primary"}>{t("Submit")}</Button>
          </CardActions>
        </Card>
      </FormContainer>
    </Page>
  )
  ;
}
