import React from "react";
import { Grid } from "@mui/material";
import { useTranslation } from "react-i18next";
import StatTile from "../../../components/StatTile";
import { formatCurrency } from "../../../common/intlUtils";
import { PaymentsOverviewData } from "../types";

type Props = {
  data: PaymentsOverviewData;
};

const CollectedVsOutstanding: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <Grid container spacing={2}>
      <Grid item sm={6} xs={12}>
        <StatTile label={t("Collected")} value={formatCurrency(data.total_collected)} />
      </Grid>
      <Grid item sm={6} xs={12}>
        <StatTile label={t("Outstanding balance")} value={formatCurrency(data.total_outstanding)} />
      </Grid>
    </Grid>
  );
};

export default CollectedVsOutstanding;
