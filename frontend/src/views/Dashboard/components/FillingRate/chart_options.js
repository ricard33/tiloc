import palette from "../../../../theme/palette";
import { formatCurrency } from "../../../../common/intlUtils";
import i18n from "../../../../i18n";

export const get_options = () => {
  return {
    // responsive: true,
    // maintainAspectRatio: false,
    // animation: false,
    // legend: { display: true },
    // cornerRadius: 20,
    plugins: {
      tooltip: {
        enabled: true,
        mode: "index",
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || "";
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
      xAxes:
        {
          // ticks: {
          //   fontColor: palette.text.secondary
          // },
          // gridLines: {
          //   display: false,
          //   drawBorder: false
          // }
        },
      yAxisFillingRate:
        {
          type: "linear",
          display: true,
          position: "left",
          min: 0,
          max: 100,
          scaleLabel: {
            display: true,
            labelString: i18n.t("Filling rate")
          },
          ticks: {
            fontColor: palette.text.secondary,
            beginAtZero: true,
            min: 0,
            callback: function(value, index, values) {
              return value + "%";
            }
          },
          grid: {
            borderDash: [5, 15],
            drawBorder: false,
          }
        },
      yAxisTurnover:
        {
          type: "linear",
          display: true,
          position: "right",
          scaleLabel: {
            display: true,
            labelString: i18n.t("Turnover")
          },
          ticks: {
            fontColor: palette.text.secondary,
            beginAtZero: true,
            min: 0,
            callback: function(value, index, values) {
              return formatCurrency(value, 0);
            }
          },
          grid: {
            borderDash: [2],
            drawBorder: false,
          }
        }
    }
  };
};
