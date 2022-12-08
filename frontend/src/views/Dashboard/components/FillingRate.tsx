import React, { useEffect, useState } from "react";
import clsx from "clsx";
import axios from "axios";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
// @ts-ignore
import autocolors from 'chartjs-plugin-autocolors';
import { makeStyles } from "@mui/styles";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useDispatch } from "react-redux";
import palette from "../../../theme/palette";
import { useTranslation } from "react-i18next";
import { TooltipItem } from "chart.js";
import { formatCurrency } from "../../../common/intlUtils";
import FormControl from "@mui/material/FormControl";
import { useListLodgingsQuery } from "../../../services/api";
import DateRangeSelector from "../../../components/DateRangeSelector";
import { addMonths, addYears, endOfMonth, endOfYear, startOfMonth, startOfYear, subYears } from "date-fns";
import { formatISO } from "../../../common/tzUtils";
import { Lodging } from "../../../types";
import { colorGen } from "../../../common/colorTools";

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
  capacity: number,
  rate: number,
  turnover: number,
  lodgings: number[],
  [lodgingId: number]: {
    days: number,
    rate: number,
    turnover: number,
  },
}

type FillingRateProps = {
  className?: string
}

const FillingRate: React.FC<FillingRateProps> = props => {
  const { className, ...rest } = props;

  const classes = useStyles();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { data: lodgings } = useListLodgingsQuery();
  const [mode, setMode] = useState<"global" | "per-lodging">("global");
  const [data, setData] = useState<FillingRateData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: addMonths(startOfMonth(subYears(today, 1)), 1),
    endDate: endOfMonth(today)
  });
  const colorGenerator = colorGen()

  // console.debug(data);

  useEffect(() => {
    axios.get(`stats/filling_rate/${formatISO(dateRange.startDate)}/${formatISO(dateRange.endDate)}/`)
      .then(response => {
        // console.debug(response);
        setData(response.data);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, [dateRange.endDate, dateRange.startDate, dispatch, t]);

  const dateRanges = [
    {
      label: t("Last year"),
      startDate: startOfYear(addYears(today, -1)),
      endDate: endOfYear(addYears(today, -1))
    },
    {
      label: t("This year"),
      startDate: startOfYear(today),
      endDate: endOfYear(today)
    },
    {
      label: t("Next year"),
      startDate: startOfYear(addYears(today, 1)),
      endDate: endOfYear(addYears(today, 1))
    }
  ];

  const computeTurnover = (lodging: Lodging) => {
    if (data) {
      return data.reduce((previousValue, currentValue) =>
        lodging.id in currentValue ? previousValue + (currentValue[lodging.id].turnover ?? 0) : previousValue, 0);
    }
    return 0;
  };

  // @ts-ignore
  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardHeader
        action={
          <FormControl>
            <DateRangeSelector
              startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange}
              definedRanges={dateRanges}
            />
            <RadioGroup
              row
              aria-labelledby="filling-rate-mode"
              name="filling-rate-mode"
              value={mode}
              onChange={(event, value) => setMode(value as never)}

            >
              <FormControlLabel value="global" control={<Radio />} label={t("global")} />
              <FormControlLabel value="per-lodging" control={<Radio />} disabled={!lodgings} label={t("per lodging")} />
            </RadioGroup>
          </FormControl>
        }
        title={mode === "global" ? t("Filling rate") : t("Turnover per lodging")}
      />
      <Divider />
      <CardContent>
        <div className={classes.chartContainer}>
          {loaded &&
            <Chart
              type="bar"
              data={{
                labels: data.map(e => e.date),
                datasets: mode === "global" ? [
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
                    borderJoinStyle: "round",
                    tension: 0.2,
                    fill: false,
                    data: data.map(e => e.turnover),
                    order: 1
                  }
                ] : lodgings!.map((lodging, index) => {
                  const color = colorGenerator.next().value as { background: string, border: string };
                  return {
                    type: "bar",
                    label: `${lodging.name}: ${formatCurrency(computeTurnover(lodging), 0)}`,
                    yAxisID: "yAxisTurnoverPerLodging",
                    backgroundColor: color.background,
                    borderColor: color.border,
                    // barThickness: 12,
                    // borderRadius: 20,
                    // maxBarThickness: 10,
                    // barPercentage: 0.5,
                    // categoryPercentage: 0.5,
                    data: data.map(e => lodging.id in e ? e[lodging.id].turnover ?? 0 : 0),
                    order: index
                  };
                })
              }}
              plugins={[autocolors]}
              options={{
                plugins: {
                  autocolors: {
                    offset: 1,
                  },
                  tooltip: {
                    enabled: true,
                    mode: "index",
                    callbacks: {
                      label: function(context: TooltipItem<"line">) {
                        let label = context.dataset!.label || "";
                        if (label) {
                          label += ": ";
                        }
                        if (context.datasetIndex === 0 && mode === "global")
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
                      display: mode === "global",
                      position: "left",
                      min: 0,
                      max: 100,
                      border: {
                        dash: [5, 15]
                      },
                      ticks: {
                        color: palette.text.secondary,
                        callback: function(value: string | number) {
                          return value + "%";
                        }
                      },
                      grid: {}
                    },
                  yAxisTurnover:
                    {
                      type: "linear",
                      display: mode === "global",
                      position: "right",
                      ticks: {
                        color: palette.text.secondary,
                        callback: function(value: string | number) {
                          return formatCurrency(value as number, 0);
                        }
                      },
                      border: {
                        dash: [2]
                      },
                      grid: {}
                    },
                  yAxisTurnoverPerLodging:
                    {
                      type: "linear",
                      display: mode === "per-lodging",
                      position: "left",
                      ticks: {
                        color: palette.text.secondary,
                        callback: function(value: string | number) {
                          return formatCurrency(value as number, 0);
                        }
                      },
                      border: {
                        dash: [2]
                      },
                      grid: {}
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
