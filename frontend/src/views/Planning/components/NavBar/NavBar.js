/* eslint-disable react/no-multi-comp */
import React, { useState } from "react";
import PropTypes from "prop-types";
import { Grid, useMediaQuery } from "@material-ui/core";
import { add, startOfMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import { formatDate } from "../../../../common/dateUtils";
import { useTheme } from "@material-ui/styles";


const NavButton = (props) => {
  const {children, ...attr} = props;
  return (
    <Button
      size="small"
      // variant="contained"
      color="primary"
      {...attr}
    >
      {children}
    </Button>
  );
};

NavButton.propTypes = {
  children: PropTypes.any,
};


const NavBar = props => {
  const {date, onChange} = props;
  const [currentDate, setCurrentDate] = useState(startOfMonth(date));
  const { t } = useTranslation();
  const theme = useTheme();
  const isPhone = useMediaQuery(theme.breakpoints.down("xs"), {
    defaultMatches: true
  });
  const monthFormat = isPhone ? "MMM" : "MMMM Y";

  const onPrevNextClick = (months) => {
    console.log(performance.now().toFixed(2), "onPrevNextClick");
    const newDate = add(date, {months: months});
    setCurrentDate(newDate)
    onChange(newDate);
  };

  return (
    <Grid container justifyContent="space-between">
      <Grid item>
        <NavButton onClick={() => onPrevNextClick(-12)}>&lt;&lt; -{isPhone ? t("12 m") : t("12 months")}</NavButton>
        <NavButton onClick={() => onPrevNextClick(-6)}>&lt;&lt; -{isPhone ? t("6 m") : t("6 months")}</NavButton>
        <NavButton onClick={() => onPrevNextClick(-1)}>
          &lt;&lt; {formatDate(add(currentDate, {months: -1}), monthFormat)}
        </NavButton>
      </Grid>
      <Grid item>
        <NavButton onClick={() => onPrevNextClick(1)}>
          {formatDate(add(currentDate, {months: 1}), monthFormat)} &gt;&gt;
        </NavButton>
        <NavButton onClick={() => onPrevNextClick(6)}>+{isPhone ? t("6 m") : t("6 months")} &gt;&gt;</NavButton>
        <NavButton onClick={() => onPrevNextClick(12)}>+{isPhone ? t("12 m") : t("12 months")} &gt;&gt;</NavButton>
      </Grid>
    </Grid>
  );
};

NavBar.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  onChange: PropTypes.func
};

export default NavBar;
