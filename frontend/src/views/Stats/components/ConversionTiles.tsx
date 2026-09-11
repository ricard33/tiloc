import React from "react";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import StatTile from "../../../components/StatTile";
import { BookingFunnelData } from "../types";

type Props = {
  data: BookingFunnelData;
};

const formatPercent = (value: number | null) => (value === null ? "—" : `${value} %`);

const ConversionTiles: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={2}>
      <Grid item sm={6} xs={12}>
        <StatTile label={t("Cancellation rate")} value={formatPercent(data.cancellation_rate)} />
      </Grid>
      <Grid item sm={6} xs={12}>
        <StatTile label={t("Contract signature rate")} value={formatPercent(data.signature_rate)} />
      </Grid>
      <Grid item sm={6} xs={12}>
        <StatTile
          label={t("Average length of stay")}
          value={data.average_length_of_stay === null ? "—" : `${data.average_length_of_stay} ${t("nights")}`}
        />
      </Grid>
      <Grid item sm={6} xs={12}>
        <StatTile
          label={t("Average booking lead time")}
          value={data.average_lead_time === null ? "—" : `${data.average_lead_time} ${t("days")}`}
        />
      </Grid>
    </Grid>
  );
};

export default ConversionTiles;
