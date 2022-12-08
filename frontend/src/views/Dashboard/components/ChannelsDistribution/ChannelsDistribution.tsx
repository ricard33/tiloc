import React, { useCallback, useEffect, useState } from "react";
import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";
import clsx from "clsx";
import { makeStyles } from "@mui/styles";
import { useTheme } from "@mui/material/styles";
import { Card, CardContent, CardHeader, Divider, IconButton, Theme } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTranslation } from "react-i18next";
import axios from "axios";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    height: "100%"
  },
  chartContainer: {
    position: "relative",
    height: "300px"
  },
  stats: {
    marginTop: theme.spacing(2),
    display: "flex",
    justifyContent: "center"
  },
  device: {
    textAlign: "center",
    padding: theme.spacing(1)
  }
  // deviceIcon: {
  //   color: theme.palette.icon
  // }
}));

type ChannelsDistributionData = {
  channel: string,
  count: number,
}

type Props = {
  className: string
}

const ChannelsDistribution: React.FC<Props> = props => {
  const { className, ...rest } = props;

  const classes = useStyles();
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
      className={clsx(classes.root, className)}
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
        <div className={classes.chartContainer}>
          <Doughnut
            data={{
              labels: data.map(e => e.channel),
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
                  footerColor: theme.palette.text.secondary
                }
              },
              responsive: true,
              maintainAspectRatio: false,
              animation: false,
              cutout: "80%",
              layout: { padding: 0 }
            }}
          />
        </div>
        {/*<div className={classes.stats}>*/}
        {/*  {devices.map(device => (*/}
        {/*    <div*/}
        {/*      className={classes.device}*/}
        {/*      key={device.title}*/}
        {/*    >*/}
        {/*      <span className={classes.deviceIcon}>{device.icon}</span>*/}
        {/*      <Typography variant="body1">{device.title}</Typography>*/}
        {/*      <Typography*/}
        {/*        style={{ color: device.color }}*/}
        {/*        variant="h2"*/}
        {/*      >*/}
        {/*        {device.value}%*/}
        {/*      </Typography>*/}
        {/*    </div>*/}
        {/*  ))}*/}
        {/*</div>*/}
      </CardContent>
    </Card>
  );
};

export default ChannelsDistribution;
