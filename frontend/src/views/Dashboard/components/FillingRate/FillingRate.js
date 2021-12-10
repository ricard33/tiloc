import React, { useEffect, useState } from "react";
import clsx from 'clsx';
import axios from "axios";
import PropTypes from 'prop-types';
import 'chart.js/auto';
import { Bar } from 'react-chartjs-2';
import { makeStyles } from '@mui/styles';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Divider,
  Button
} from '@mui/material';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { useDispatch } from "react-redux";
import palette from "../../../../theme/palette";
import { useTranslation } from "react-i18next";
import { get_options } from './chart_options';

const useStyles = makeStyles(() => ({
  root: {},
  chartContainer: {
    // height: 400,
    position: 'relative',
    "& canvas": {
      // height: "400px !important",
    }

  },
  actions: {
    justifyContent: 'flex-end'
  }
}));

const FillingRate = props => {
  const { className, ...rest } = props;

  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [data, setData] = useState({labels: [], datasets: []});
  const [loaded, setLoaded] = useState(false);

  // console.debug(data);

  useEffect(() => {
    axios.get("stats/filling_rate/")
      .then(response => {
        // console.debug(response);
        setData({
          labels: response.data.map(e => e.date),
          datasets: [
            {
              label: t("Filling rate"),
              yAxisID: "yAxisFillingRate",
              backgroundColor: palette.primary.main,
              // barThickness: 12,
              maxBarThickness: 10,
              // barPercentage: 0.5,
              // categoryPercentage: 0.5,
              data: response.data.map(e => e.rate),
              order: 2
            },
            {
              label: t("Turnover"),
              yAxisID: "yAxisTurnover",
              backgroundColor: palette.warning.main,
              borderColor: palette.warning.main,
              type: "line",
              fill: false,
              data: response.data.map(e => e.turnover),
              order: 1
            },
          ]
        });
        setLoaded(true)
      })
      .catch(() => {
        setLoaded(true);
      });
  }, [dispatch, t]);

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardHeader
        // action={
        //   <Button
        //     size="small"
        //     variant="text"
        //   >
        //     {t("Last year")} <ArrowDropDownIcon />
        //   </Button>
        // }
        title={t("Filling rate")}
      />
      <Divider />
      <CardContent>
        <div className={classes.chartContainer}>
          {loaded &&
          <Bar
            data={data}
            type="line"
            options={get_options()}
          />}
        </div>
      </CardContent>
      <Divider />
      <CardActions className={classes.actions}>
        <Button
          color="primary"
          size="small"
          variant="text"
        >
          Overview <ArrowRightIcon />
        </Button>
      </CardActions>
    </Card>
  );
};

FillingRate.propTypes = {
  className: PropTypes.string
};

export default FillingRate;
