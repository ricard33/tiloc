import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import clsx from "clsx";

const useStyles = makeStyles(theme => ({
  root: {
    // padding: theme.spacing(4)
  }
}));

const RateDetail = props => {
  const { className, beginDate, endDate, dayCount, rateName, isWeekRate } = props;
  const { t } = useTranslation();
  const classes = useStyles();
  const fullRateName = (rateName || t("default rate")) + (isWeekRate ? " " + t("week") : "");

  return <span className={clsx(classes.root, className)}>
    {t("From {{begin_date}} to {{end_date}}: {{day_count}} x {{rate}}€ ({{rate_name}})",
      {
        begin_date: beginDate,
        end_date: endDate,
        day_count: dayCount,
        rate_name: fullRateName
      })}</span>;
};

RateDetail.propTypes = {
  className: PropTypes.string,
  beginDate: PropTypes.instanceOf(Date),
  endDate: PropTypes.instanceOf(Date),
  dayCount: PropTypes.number,
  rateName: PropTypes.string,
  isWeekEnd: PropTypes.bool
};

RateDetail.defaultProps = {
  isWeekRate: false
};
