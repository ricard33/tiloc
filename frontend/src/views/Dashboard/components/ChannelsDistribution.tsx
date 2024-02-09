import React, { useCallback, useEffect, useState } from "react";
import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";
import { useTheme } from "@mui/material/styles";
import { Card, CardContent, CardHeader, Divider, IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { TooltipItem } from "chart.js";

type ChannelsDistributionData = {
  channel: string,
  count: number,
}

type Props = {
  className?: string
}

const ChannelsDistribution: React.FC<Props> = props => {
  const { className, ...rest } = props;

  const theme = useTheme();
  const { t } = useTranslation();
  const [data, setData] = useState<ChannelsDistributionData[]>([]);

  const loadChannelsDistribution = useCallback(() => {
    axios.get("stats/channel_distribution/")
      .then(response => {
        // console.debug(response);
        setData(response.data);
      })
      .catch(() => {
      });
  }, []);

  useEffect(() => {
    loadChannelsDistribution();
  }, [loadChannelsDistribution]);

  return (
    <Card
      {...rest}
      className={className}
      sx={{ height: "100%" }}
    >
      <CardHeader
        action={
          <IconButton size="small" onClick={() => loadChannelsDistribution()}>
            <RefreshIcon />
          </IconButton>
        }
        title={t("Origin of bookings")}
      />
      <Divider />
      <CardContent>
        <div style={{ position: "relative", height: "300px" }}>
          <Doughnut
            data={{
              labels: data.map(e => e.channel ?? t("Not set")),
              datasets: [
                {
                  label: t("Origin of bookings"),
                  backgroundColor: [
                    "red", "green", "yellow", "grey", "blue", "orange", "purple"
                  ],
                  borderWidth: 8,
                  borderColor: theme.palette.common.white,
                  hoverBorderColor: theme.palette.common.white,
                  data: data.map(e => e.count)
                }
              ]
            }}
            options={{
              plugins: {
                legend: {
                  display: true
                },
                tooltip: {
                  enabled: true,
                  // mode: 'index',
                  intersect: false,
                  borderWidth: 1,
                  borderColor: theme.palette.divider,
                  backgroundColor: theme.palette.common.white,
                  titleColor: theme.palette.text.primary,
                  bodyColor: theme.palette.text.secondary,
                  footerColor: theme.palette.text.secondary,
                  callbacks: {
                    label: function(context: TooltipItem<"doughnut">) {
                      return `${context.parsed} (${(context.parsed / context.dataset?.data.reduce((prev, cur) => prev + cur, 0) * 100).toFixed()}%)`;
                    }
                  }
                }
              },
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              cutout: "50%",
              layout: { padding: 0 }
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelsDistribution;
