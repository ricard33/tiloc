import React, { useEffect, useState } from "react";
import axios from "axios";
import "chart.js/auto";
import { Chart } from "react-chartjs-2";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup
} from "@mui/material";
import ArrowRightIcon from "@mui/icons-material/ArrowRight";
import { useDispatch } from "react-redux";
import palette from "../../../theme/palette";
import { useTranslation } from "react-i18next";
import { ChartDataset, TooltipItem } from "chart.js";
import { formatCurrency } from "../../../common/intlUtils";
import { useListLodgingsQuery } from "../../../services/api";
import DateRangeSelector, { RangeNames } from "../../../components/DateRangeSelector";
import { addMonths, endOfMonth, startOfMonth, subYears } from "date-fns";
import { formatISO } from "../../../common/tzUtils";
import { Lodging } from "../../../types";
import { colorGen } from "../../../common/colorTools";


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

  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { data: lodgings } = useListLodgingsQuery({ shown: true, active: true });
  const [mode, setMode] = useState<"global" | "per-lodging">("global");
  const [previousYear, setPreviousYear] = useState<boolean>(true);
  const [data, setData] = useState<FillingRateData[]>([]);
  const [previousYearData, setPreviousYearData] = useState<FillingRateData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    startDate: addMonths(startOfMonth(subYears(today, 1)), 1),
    endDate: endOfMonth(today)
  });
  const colorGenerator = colorGen();

  // console.debug(data);

  useEffect(() => {
    axios.get(`stats/filling_rate/${formatISO(dateRange.startDate)}/${formatISO(dateRange.endDate)}/`)
      .then(response => {
        // console.debug(response);
        setData(response.data);
        setLoaded(true);
        axios.get(`stats/filling_rate/${formatISO(subYears(dateRange.startDate, 1))}/${formatISO(subYears(dateRange.endDate, 1))}/`)
          .then(response => {
            // console.debug(response);
            setPreviousYearData(response.data);
            setLoaded(true);
          })
          .catch(() => {
            setLoaded(true);
          });
      })
      .catch(() => {
        setLoaded(true);
      });
  }, [dateRange.endDate, dateRange.startDate, dispatch, t]);

  const dateRanges = [RangeNames.LastYear, RangeNames.ThisYear, RangeNames.NextYear];

  function getGlobalTurnover(data: FillingRateData[]) {
    return data ?
      data.reduce((previousValue, currentValue) => previousValue + (currentValue.turnover ?? 0), 0)
      : 0;
  }

  const globalTurnover = getGlobalTurnover(data);
  const globalTurnoverPreviousYear = getGlobalTurnover(previousYearData);

  function getGlobalRate(data: FillingRateData[]) {
    return data ?
      data.reduce((previousValue, currentValue) => previousValue + (currentValue.rate ?? 0), 0) / data.length
      : 0;
  }

  const globalRate = getGlobalRate(data);
  const globalRatePreviousYear = getGlobalRate(previousYearData);

  const computeTurnover = (data: FillingRateData[], lodging: Lodging) => {
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
      className={className}
    >
      <CardHeader
        action={
          <FormControl>
            <DateRangeSelector
              startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={setDateRange}
              rangeNames={dateRanges}
            />
            <RadioGroup
              row
              aria-labelledby="filling-rate-mode"
              name="filling-rate-mode"
              value={mode}
              onChange={(_, value) => setMode(value as never)}

            >
              <FormControlLabel value="global" control={<Radio />} label={t("global")} />
              <FormControlLabel value="per-lodging" control={<Radio />} disabled={!lodgings} label={t("per lodging")} />
            </RadioGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={previousYear}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setPreviousYear(event.target.checked);
                  }}
                  inputProps={{ "aria-label": "controlled" }}
                />}
              label={t("Show previous year")}
            />
          </FormControl>
        }
        title={mode === "global" ? t("Filling rate") : t("Turnover per lodging")}
      />
      <Divider />
      <CardContent>
        <div
          style={{
            position: "relative",
          }}
        >
          {loaded &&
            <Chart
              type="bar"
              data={{
                labels: data.map(e => e.date),
                datasets: mode === "global" ? [
                  {
                    type: "bar",
                    label: t("Filling rate") + ` (${globalRate.toFixed()}%)`,
                    yAxisID: "yAxisFillingRate",
                    backgroundColor: palette.primary.main,
                    barThickness: 12,
                    borderRadius: 20,
                    maxBarThickness: 10,
                    barPercentage: 0.5,
                    categoryPercentage: 0.5,
                    data: data.map(e => e.rate),
                    order: 3
                  },
                  {
                    type: "line",
                    label: t("Turnover") + ` (${formatCurrency(globalTurnover)})`,
                    yAxisID: "yAxisTurnover",
                    backgroundColor: palette.warning.dark,
                    borderColor: palette.warning.dark,
                    borderJoinStyle: "round",
                    tension: 0.2,
                    fill: false,
                    data: data.map(e => e.turnover),
                    order: 1
                  },
                  ...(previousYear ? [
                    {
                      type: "bar",
                      label: t("Filling rate (previous year)") + ` (${globalRatePreviousYear.toFixed()}%)`,
                      yAxisID: "yAxisFillingRate",
                      backgroundColor: palette.primary.light,
                      barThickness: 12,
                      borderRadius: 20,
                      maxBarThickness: 10,
                      barPercentage: 0.5,
                      categoryPercentage: 0.5,
                      data: previousYearData.map(e => e.rate),
                      order: 4
                    },
                    {
                      type: "line",
                      label: t("Turnover (previous year)") + ` (${formatCurrency(globalTurnoverPreviousYear)})`,
                      yAxisID: "yAxisTurnover",
                      backgroundColor: palette.warning.light,
                      borderColor: palette.warning.light,
                      borderJoinStyle: "round",
                      tension: 0.2,
                      fill: false,
                      data: previousYearData.map(e => e.turnover),
                      order: 2
                    }
                  ] : []) as ChartDataset<"line" | "bar", number[]>[],
                ]
                  :
                lodgings!.map((lodging, index) => {
                  const color = colorGenerator.next().value as { background: string, border: string };
                  return {
                    type: "bar",
                    label: `${lodging.name}: ${formatCurrency(computeTurnover(data, lodging), 0)}`,
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
              options={{
                plugins: {
                  tooltip: {
                    enabled: true,
                    mode: "index",
                    callbacks: {
                      label: function(context: TooltipItem<"line">) {
                        let label;
                        if ((context.datasetIndex === 0 || context.datasetIndex === 2) && mode === "global")
                          label = t("Filling rate") + ": " + context.parsed.y + " %";
                        else
                          label = t("Turnover") + ": " +  formatCurrency(context.parsed.y ?? 0);
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
      <CardActions sx={{justifyContent: "flex-end"}}>
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
