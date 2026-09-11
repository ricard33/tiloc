import React from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { TooltipItem } from "chart.js";
import { useAppSelector } from "../../../app/hooks";
import { formatCurrency } from "../../../common/intlUtils";
import { categoricalColor } from "../../../common/chartPalette";
import { User } from "../../../types";
import { SeasonBreakdownData } from "../types";

type Props = {
  data: SeasonBreakdownData;
};

const SeasonBreakdown: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const user = useAppSelector(store => store.auth.user) as User;
  const canViewPrices = user.permissions.includes("core.view_prices");

  const seasonNames = Object.keys(data).sort((a, b) => {
    if (a === "unassigned") return 1;
    if (b === "unassigned") return -1;
    return a.localeCompare(b);
  });
  const labels = seasonNames.map(name => (name === "unassigned" ? t("No season") : name));
  const values = canViewPrices
    ? seasonNames.map(name => data[name].turnover ?? 0)
    : seasonNames.map(name => data[name].days);

  return (
    <Card>
      <CardHeader title={t("Revenue by season")} />
      <Divider />
      <CardContent>
        <div style={{ position: "relative", height: "280px" }}>
          <Chart
            type="bar"
            data={{
              labels,
              datasets: [
                {
                  type: "bar",
                  label: canViewPrices ? t("Turnover") : t("Occupied nights"),
                  backgroundColor: labels.map((_, index) => categoricalColor(index, isDark)),
                  borderRadius: 4,
                  barThickness: 24,
                  data: values,
                },
              ],
            }}
            options={{
              plugins: {
                legend: { display: false },
                tooltip: canViewPrices
                  ? { callbacks: { label: (context: TooltipItem<"bar">) => formatCurrency((context.parsed.y as number) ?? 0) } }
                  : {},
              },
              scales: canViewPrices ? { y: { ticks: { callback: value => formatCurrency(value as number, 0) } } } : {},
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SeasonBreakdown;
