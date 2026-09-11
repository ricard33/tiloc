import React from "react";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import StatTile from "../../../components/StatTile";
import { formatCurrency } from "../../../common/intlUtils";
import { PaymentsOverviewData } from "../types";

type Props = {
  data: PaymentsOverviewData;
};

const TouristTaxAndGuests: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={2}>
      <Grid item sm={6} xs={12}>
        <StatTile label={t("Tourist tax collected")} value={formatCurrency(data.total_tourist_tax)} />
      </Grid>
      <Grid item sm={6} xs={12}>
        <StatTile label={t("Guests hosted")} value={data.total_guests} />
      </Grid>
    </Grid>
  );
};

export default TouristTaxAndGuests;
