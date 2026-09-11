import React from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { Card, CardContent, CardHeader, Divider, Grid } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../app/hooks";
import { formatCurrency } from "../../../common/intlUtils";
import { categoricalColor, withAlpha } from "../../../common/chartPalette";
import StatTile from "../../../components/StatTile";
import { User } from "../../../types";
import { FillingRateRow } from "../types";

type Props = {
  data: FillingRateRow[];
  previousYearData: FillingRateRow[];
};

const sum = (rows: FillingRateRow[], pick: (row: FillingRateRow) => number) =>
  rows.reduce((total, row) => total + pick(row), 0);

const OccupancyAndRevenue: React.FC<Props> = ({ data, previousYearData }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const user = useAppSelector(store => store.auth.user) as User;
  const canViewPrices = user.permissions.includes("core.view_prices");

  const totalDays = sum(data, row => row.days);
  const totalCapacity = sum(data, row => row.capacity);
  const totalTurnover = sum(data, row => row.turnover ?? 0);
  const averageRate = data.length ? sum(data, row => row.rate) / data.length : 0;
  const adr = totalDays > 0 ? totalTurnover / totalDays : 0;
  const revPar = totalCapacity > 0 ? totalTurnover / totalCapacity : 0;

  const occupancyColor = categoricalColor(0, isDark);
  const turnoverColor = categoricalColor(1, isDark);

  return (
    <Grid container spacing={4}>
      <Grid item md={canViewPrices ? 3 : 6} xs={6}>
        <StatTile label={t("Average occupancy")} value={`${averageRate.toFixed()} %`} />
      </Grid>
      <Grid item md={canViewPrices ? 3 : 6} xs={6}>
        <StatTile label={t("Occupied nights")} value={totalDays} />
      </Grid>
      {canViewPrices && (
        <Grid item md={3} xs={6}>
          <StatTile label={t("Average daily rate")} value={formatCurrency(adr)} />
        </Grid>
      )}
      {canViewPrices && (
        <Grid item md={3} xs={6}>
          <StatTile label={t("RevPAR")} value={formatCurrency(revPar)} />
        </Grid>
      )}
      <Grid item md={canViewPrices ? 6 : 12} xs={12}>
        <Card>
          <CardHeader title={t("Occupancy rate")} />
          <Divider />
          <CardContent>
            <div style={{ position: "relative", height: "260px" }}>
              <Chart
                type="bar"
                data-testid="occupancy-chart"
                data={{
                  labels: data.map(row => row.date),
                  datasets: [
                    {
                      type: "bar",
                      label: t("Occupancy rate"),
                      backgroundColor: occupancyColor,
                      borderRadius: 4,
                      barThickness: 16,
                      data: data.map(row => row.rate),
                    },
                    {
                      type: "bar",
                      label: t("Occupancy rate (previous year)"),
                      backgroundColor: withAlpha(occupancyColor, 0.35),
                      borderRadius: 4,
                      barThickness: 16,
                      data: previousYearData.map(row => row.rate),
                    },
                  ],
                }}
                options={{
                  scales: { y: { min: 0, max: 100, ticks: { callback: value => `${value} %` } } },
                  plugins: { legend: { display: true } },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </Grid>
      {canViewPrices && (
        <Grid item md={6} xs={12}>
          <Card>
            <CardHeader title={t("Turnover")} />
            <Divider />
            <CardContent>
              <div style={{ position: "relative", height: "260px" }}>
                <Chart
                  type="bar"
                  data-testid="turnover-chart"
                  data={{
                    labels: data.map(row => row.date),
                    datasets: [
                      {
                        type: "bar",
                        label: t("Turnover"),
                        backgroundColor: turnoverColor,
                        borderRadius: 4,
                        barThickness: 16,
                        data: data.map(row => row.turnover ?? 0),
                      },
                      {
                        type: "bar",
                        label: t("Turnover (previous year)"),
                        backgroundColor: withAlpha(turnoverColor, 0.35),
                        borderRadius: 4,
                        barThickness: 16,
                        data: previousYearData.map(row => row.turnover ?? 0),
                      },
                    ],
                  }}
                  options={{
                    scales: { y: { ticks: { callback: value => formatCurrency(value as number, 0) } } },
                    plugins: { legend: { display: true } },
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
};

export default OccupancyAndRevenue;
