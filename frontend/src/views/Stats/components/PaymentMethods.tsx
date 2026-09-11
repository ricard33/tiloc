import React from "react";
import "chart.js/auto";
import { Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, Divider } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import { TooltipItem } from "chart.js";
import { formatCurrency } from "../../../common/intlUtils";
import { categoricalColor } from "../../../common/chartPalette";
import { PaymentsOverviewData } from "../types";

const METHOD_LABELS: Record<string, string> = {
  cash: "Cash",
  bank_card: "Bank card",
  check: "Check",
  transfer: "Transfer",
  paypal: "PayPal",
  vouchers: "Holiday vouchers",
  other: "Other",
};

type Props = {
  data: PaymentsOverviewData;
};

const PaymentMethods: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader title={t("Payments by method")} />
      <Divider />
      <CardContent>
        <div style={{ position: "relative", height: "280px" }}>
          <Doughnut
            data={{
              labels: data.payment_methods.map(row => t(METHOD_LABELS[row.method] ?? row.method)),
              datasets: [
                {
                  label: t("Payments by method"),
                  backgroundColor: data.payment_methods.map((_, index) => categoricalColor(index, isDark)),
                  borderWidth: 2,
                  data: data.payment_methods.map(row => row.total),
                },
              ],
            }}
            options={{
              plugins: {
                legend: { display: true },
                tooltip: {
                  callbacks: {
                    label: (context: TooltipItem<"doughnut">) => formatCurrency((context.raw as number) ?? 0),
                  },
                },
              },
              cutout: "50%",
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethods;
