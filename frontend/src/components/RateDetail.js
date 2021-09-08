import React from 'react';
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";


const RateDetail = props => {
  const { className, beginDate, endDate, dayCount, rateName, isWeekRate } = props;
  const { t } = useTranslation();
  const fullRateName = (rateName || t("default rate")) + (isWeekRate ? " " + t("week") : "");

  return <span className={className}>
    {t("From {{begin_date}} to {{end_date}}: {{day_count}} x {{rate}}€ ({{rate_name}})",
      {
        begin_date: beginDate,
        end_date: endDate,
        day_count: dayCount,
        rate_name: fullRateName
      })}</span>;
};

RateDetail.propTypes = {
  beginDate: PropTypes.instanceOf(Date),
  className: PropTypes.string,
  dayCount: PropTypes.number,
  endDate: PropTypes.instanceOf(Date),
  isWeekRate: PropTypes.bool,
  rateName: PropTypes.string,
};

RateDetail.defaultProps = {
  isWeekRate: false
};
