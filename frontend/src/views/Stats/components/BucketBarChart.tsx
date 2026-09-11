import React from "react";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { categoricalColor } from "../../../common/chartPalette";
import { BucketRow } from "../types";

type Props = {
  title: string;
  data: BucketRow[];
  seriesLabel: string;
  colorSlot?: number;
};

/** A single-hue bucketed histogram (length-of-stay, lead-time, ...): magnitude per ordinal bucket. */
const BucketBarChart: React.FC<Props> = ({ title, data, seriesLabel, colorSlot = 2 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card>
      <CardHeader title={title} />
      <Divider />
      <CardContent>
        <div style={{ position: "relative", height: "260px" }}>
          <Chart
            type="bar"
            data={{
              labels: data.map(row => row.label),
              datasets: [
                {
                  type: "bar",
                  label: seriesLabel,
                  backgroundColor: categoricalColor(colorSlot, isDark),
                  borderRadius: 4,
                  barThickness: 20,
                  data: data.map(row => row.count),
                },
              ],
            }}
            options={{
              plugins: { legend: { display: false } },
              scales: { y: { ticks: { precision: 0 } } },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default BucketBarChart;
