import React from "react";
import { AutoField, AutoForm, ErrorsField, HiddenField, NumField, SelectField, SubmitField } from "uniforms-mui";

import { lodgingBridge } from "../../types/lodgingSchema";
import { useParams } from "react-router-dom";
import { useGetLodgingQuery, useListOwnersQuery } from "../../services/api";
import Page from "../../layouts/Main/Page";
import { Button, Card, CardActions, CardContent, CardHeader } from "@mui/material";
import { useTranslation } from "react-i18next";
import InputAdornment from "@mui/material/InputAdornment";
import Grid2 from "@mui/material/Unstable_Grid2";

export function LodgingFormBasic() {
  const { t } = useTranslation();
  let { lodgingId } = useParams();
  const {
    data: lodging,
    isLoading
  } = useGetLodgingQuery(Number(lodgingId), { skip: typeof lodgingId === "undefined" });
  const { data: owners } = useListOwnersQuery();

  const ownersOptions: { label: string, value: number }[] = owners ? owners.map((owner, index) => {
    return { label: owner.name, value: owner.id };
  }) : [];

  if (isLoading) return <div>Loading...</div>;
  return (
    <Page>
      <AutoForm schema={lodgingBridge} model={lodging} onSubmit={console.log}>
        <Card sx={{maxWidth: "800px"}}>
          <CardHeader title={t("Lodging properties")} />
          <CardContent sx={{}}>
            <HiddenField name={"id"} />
            <Grid2 container spacing={4}>
              <Grid2 xs={12}>
                <AutoField name={"name"} />
              </Grid2>
              <Grid2 sm={6} xs={12}>
                <AutoField name={"address"} />
              </Grid2>
              <Grid2 sm={6} xs={12}>
                <SelectField
                  name={"owner"}
                  // @ts-ignore
                  options={ownersOptions}
                />
                <AutoField name={"active"} />
                <AutoField name={"shown"} />
                <HiddenField name={"rank"} />
              </Grid2>
              <Grid2 sm={3} xs={6}>
                <AutoField name={"capacity"} />
              </Grid2>
              <Grid2 sm={3} xs={6}>
                <NumField
                  name={"daily_rate"}
                  InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                />
              </Grid2>
              <Grid2 sm={3} xs={6}>
                <NumField
                  name={"guaranty"}
                  InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                />
              </Grid2>
              <Grid2 sm={3} xs={6}>
                <NumField
                  name={"tourist_tax"}
                  InputProps={{ endAdornment: <InputAdornment position="end">&euro;</InputAdornment> }}
                />
              </Grid2>
              <Grid2 xs={12}>
                <AutoField name={"information"} />
              </Grid2>
              <Grid2 xs={12}>
                <AutoField name={"description"} />
              </Grid2>
              <Grid2 xs={12}>
                <ErrorsField />
              </Grid2>
            </Grid2>
          </CardContent>
          <CardActions>
            <Button>{t("Cancel")}</Button>
            <SubmitField />
          </CardActions>
        </Card>
      </AutoForm>
    </Page>
  )
  ;
}
