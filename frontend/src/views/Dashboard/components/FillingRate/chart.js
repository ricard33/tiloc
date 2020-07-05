import palette from "theme/palette";
import { formatCurrency } from "../../../../common/intlUtils";
import i18n from "i18n";

export const get_options = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    legend: { display: true },
    cornerRadius: 20,
    tooltips: {
      enabled: true,
      mode: "nearest",
      intersect: false,
      callbacks: {
        label: function(tooltipItem, data) {
          let label = data.datasets[tooltipItem.datasetIndex].label || "";
          if (label) {
            label += ": ";
          }
          if (tooltipItem.datasetIndex === 0)
            label += tooltipItem.yLabel + " %";
          else
            label += formatCurrency(tooltipItem.yLabel);
          return label;
        }
      },
      borderWidth: 1,
      borderColor: palette.divider,
      backgroundColor: palette.white,
      titleFontColor: palette.text.primary,
      bodyFontColor: palette.text.secondary,
      footerFontColor: palette.text.secondary
    },
    layout: { padding: 0 },
    scales: {
      xAxes: [
        {
          ticks: {
            fontColor: palette.text.secondary
          },
          gridLines: {
            display: false,
            drawBorder: false
          }
        }
      ],
      yAxes: [
        {
          type: "linear",
          display: true,
          position: "left",
          id: "y-axis-filling-rate",
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
          gridLines: {
            borderDash: [2],
            borderDashOffset: [2],
            color: palette.divider,
            drawBorder: false,
            zeroLineBorderDash: [2],
            zeroLineBorderDashOffset: [2],
            zeroLineColor: palette.divider
          }
        },
        {
          type: "linear",
          display: true,
          position: "right",
          id: "y-axis-turnover",
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
          gridLines: {
            borderDash: [2],
            borderDashOffset: [2],
            color: palette.divider,
            drawBorder: false,
            zeroLineBorderDash: [2],
            zeroLineBorderDashOffset: [2],
            zeroLineColor: palette.divider
          }
        }
      ]
    }
  };
};
