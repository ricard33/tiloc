import React from "react";
import { useTranslation } from "react-i18next";
import BucketBarChart from "./BucketBarChart";
import { BookingFunnelData } from "../types";

type Props = {
  data: BookingFunnelData;
};

const LeadTimeDistribution: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <BucketBarChart
      title={t("Booking lead time (days)")}
      data={data.lead_time_distribution}
      seriesLabel={t("Bookings")}
      colorSlot={3}
    />
  );
};

export default LeadTimeDistribution;
