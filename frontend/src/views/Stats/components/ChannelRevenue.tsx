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
import { ChannelRow } from "../types";

type Props = {
  data: ChannelRow[];
};

const ChannelRevenue: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const user = useAppSelector(store => store.auth.user) as User;
  const canViewPrices = user.permissions.includes("core.view_prices");

  const labels = data.map(row => row.channel ?? t("Direct booking"));
  const values = canViewPrices ? data.map(row => row.turnover ?? 0) : data.map(row => row.count);

  return (
    <Card>
      <CardHeader title={canViewPrices ? t("Revenue per channel") : t("Bookings per channel")} />
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
                  label: canViewPrices ? t("Turnover") : t("Bookings"),
                  backgroundColor: labels.map((_, index) => categoricalColor(index, isDark)),
                  borderRadius: 4,
                  barThickness: 20,
                  data: values,
                },
              ],
            }}
            options={{
              indexAxis: "y",
              plugins: {
                legend: { display: false },
                tooltip: canViewPrices
                  ? { callbacks: { label: (context: TooltipItem<"bar">) => formatCurrency((context.parsed.x as number) ?? 0) } }
                  : {},
              },
              scales: { x: { ticks: { precision: canViewPrices ? undefined : 0 } } },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelRevenue;
