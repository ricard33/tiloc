import React, { useEffect, useState } from "react";
import clsx from "clsx";
import axios from "axios";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import { makeStyles } from "@mui/styles";
import { Button, Card, CardActions, CardContent, CardHeader, Divider } from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useDispatch } from "react-redux";
import palette from "../../../../theme/palette";
import { useTranslation } from "react-i18next";
import { TooltipItem } from "chart.js";
import { formatCurrency } from "../../../../common/intlUtils";

const useStyles = makeStyles(() => ({
  root: {},
  chartContainer: {
    // height: 400,
    position: "relative",
    "& canvas": {
      // height: "400px !important",
    }

  },
  actions: {
    justifyContent: "flex-end"
  }
}));

type FillingRateData = {
  date: string,
  rate: number,
  turnover: number,
}

type FillingRateProps = {
  className: string
}

const FillingRate: React.FC<FillingRateProps> = props => {
  const { className, ...rest } = props;

  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [data, setData] = useState<FillingRateData[]>([]);
  const [loaded, setLoaded] = useState(false);

  // console.debug(data);

  useEffect(() => {
    axios.get("stats/filling_rate/")
      .then(response => {
        // console.debug(response);
        setData(response.data);
        setLoaded(true);
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
            <Chart
              type="bar"
              data={{
                labels: data.map(e => e.date),
                datasets: [
                  {
                    type: "bar",
                    label: t("Filling rate"),
                    yAxisID: "yAxisFillingRate",
                    backgroundColor: palette.primary.main,
                    barThickness: 12,
                    borderRadius: 20,
                    maxBarThickness: 10,
                    barPercentage: 0.5,
                    categoryPercentage: 0.5,
                    data: data.map(e => e.rate),
                    order: 2
                  },
                  {
                    type: "line",
                    label: t("Turnover"),
                    yAxisID: "yAxisTurnover",
                    backgroundColor: palette.warning.main,
                    borderColor: palette.warning.main,
                    borderJoinStyle: 'round',
                    tension: 0.2,
                    fill: false,
                    data: data.map(e => e.turnover),
                    order: 1
                  }
                ]
              }}
              options={{
                plugins: {
                  tooltip: {
                    enabled: true,
                    mode: "index",
                    callbacks: {
                      label: function(context: TooltipItem<"line">) {
                        let label = context.dataset!.label || "";
                        if (label) {
                          label += ": ";
                        }
                        if (context.datasetIndex === 0)
                          label += context.parsed.y + " %";
                        else
                          label += formatCurrency(context.parsed.y);
                        return label;
                      }
                    }
                  }
                },
                scales: {
                  yAxisFillingRate:
                    {
                      type: "linear",
                      display: true,
                      position: "left",
                      min: 0,
                      max: 100,
                      border: {
                        dash: [5, 15],
                      },
                      ticks: {
                        color: palette.text.secondary,
                        callback: function(value: string|number) {
                          return value + "%";
                        }
                      },
                      grid: {
                      }
                    },
                  yAxisTurnover:
                    {
                      type: "linear",
                      display: true,
                      position: "right",
                      ticks: {
                        color: palette.text.secondary,
                        callback: function(value: string|number) {
                          return formatCurrency(value as number, 0);
                        }
                      },
                      border: {
                        dash: [2],
                      },
                      grid: {
                      }
                    }
                }
              }}
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

export default FillingRate;
