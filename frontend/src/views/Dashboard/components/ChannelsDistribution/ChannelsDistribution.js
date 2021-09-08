import React, { useEffect, useState } from "react";
import { Doughnut } from 'react-chartjs-2';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@mui/styles';
import {
  Card,
  CardHeader,
  CardContent,
  IconButton,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import axios from "axios";

const useStyles = makeStyles(theme => ({
  root: {
    height: '100%'
  },
  chartContainer: {
    position: 'relative',
    height: '300px'
  },
  stats: {
    marginTop: theme.spacing(2),
    display: 'flex',
    justifyContent: 'center'
  },
  device: {
    textAlign: 'center',
    padding: theme.spacing(1)
  },
  deviceIcon: {
    color: theme.palette.icon
  }
}));

const ChannelsDistribution = props => {
  const { className, ...rest } = props;

  const classes = useStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [data, setData] = useState({});

  const options = {
    legend: {
      display: true
    },
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    cutoutPercentage: 80,
    layout: { padding: 0 },
    tooltips: {
      enabled: true,
      // mode: 'index',
      intersect: false,
      borderWidth: 1,
      borderColor: theme.palette.divider,
      backgroundColor: theme.palette.white,
      titleFontColor: theme.palette.text.primary,
      bodyFontColor: theme.palette.text.secondary,
      footerFontColor: theme.palette.text.secondary
    }
  };

  useEffect(() => {
    axios.get("stats/channel_distribution/")
      .then(response => {
        // console.debug(response);
        setData({
          labels: response.data.map(e => e.channel),
          datasets: [
            {
              label: t("Origin of bookings"),
              backgroundColor: [
                "red", "green", "yellow", "grey", "blue", "orange", "purple"
              ],
              borderWidth: 8,
              borderColor: theme.palette.white,
              hoverBorderColor: theme.palette.white,
              data: response.data.map(e => e.count)
            }
          ]
        });
      })
      .catch(() => {
      });
  }, [dispatch, t, theme.palette.white]);

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardHeader
        action={
          <IconButton size="small">
            <RefreshIcon />
          </IconButton>
        }
        title={t("Origin of bookings")}
      />
      <Divider />
      <CardContent>
        <div className={classes.chartContainer}>
          <Doughnut
            data={data}
            options={options}
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

ChannelsDistribution.propTypes = {
  className: PropTypes.string
};

export default ChannelsDistribution;
