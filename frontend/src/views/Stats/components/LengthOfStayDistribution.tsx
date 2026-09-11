import React from "react";
import { useTranslation } from "react-i18next";
import BucketBarChart from "./BucketBarChart";
import { BookingFunnelData } from "../types";

type Props = {
  data: BookingFunnelData;
};

const LengthOfStayDistribution: React.FC<Props> = ({ data }) => {
  const { t } = useTranslation();
  return (
    <BucketBarChart
      title={t("Length of stay (nights)")}
      data={data.length_of_stay_distribution}
      seriesLabel={t("Bookings")}
      colorSlot={2}
    />
  );
};

export default LengthOfStayDistribution;
