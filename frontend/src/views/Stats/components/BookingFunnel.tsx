import React from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { categoricalColor } from "../../../common/chartPalette";
import { getBookingStatus } from "../../../common/statusUtils";
import { BookingFunnelData } from "../types";

type Props = {
  data: BookingFunnelData;
};

const BookingFunnel: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card>
      <CardHeader title={t("Bookings by status")} />
      <Divider />
      <CardContent>
        <div style={{ position: "relative", height: "300px" }} data-testid="booking-funnel-chart">
          <Chart
            type="bar"
            data={{
              labels: data.funnel.map(row => getBookingStatus(row.status).getLabel(t)),
              datasets: [
                {
                  type: "bar",
                  label: t("Bookings"),
                  backgroundColor: categoricalColor(0, isDark),
                  borderRadius: 4,
                  barThickness: 20,
                  data: data.funnel.map(row => row.count),
                },
              ],
            }}
            options={{
              indexAxis: "y",
              plugins: { legend: { display: false } },
              scales: { x: { ticks: { precision: 0 } } },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingFunnel;
