/* eslint-disable react/no-multi-comp */
import React, { useState } from "react";
import { Grid, Button, ButtonProps } from "@mui/material";
import { add, startOfMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../../../common/dateUtils";
import useWindowDimensions from "../../../../common/windowDimensions";

interface NavButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

const NavButton: React.FC<NavButtonProps> = (props) => {
  const {children, ...attr} = props;
  return (
    <Button
      size="small"
      variant="outlined"
      color="primary"
      {...attr}
    >
      {children}
    </Button>
  );
};


type NavBarProps = {
  date: Date,
  onChange: (newDate: Date) => void,
  hideMonthNav?: boolean,
};


const DateNavBar: React.FC<NavBarProps> = props => {
  const {date, onChange, hideMonthNav} = props;
  // const [currentDate, setCurrentDate] = useState(startOfMonth(date));
  const currentDate = startOfMonth(date);
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isPhone = windowWidth < 600;
  const monthFormat = isPhone ? "MMM" : "MMMM Y";

  const onPrevNextClick = (months: number) => {
    console.log(performance.now().toFixed(2), "onPrevNextClick");
    const newDate = add(date, {months: months});
    // setCurrentDate(newDate)
    onChange(newDate);
  };

  return (
    <Grid container justifyContent="space-between">
      <Grid item className="backward-buttons">
        {!isPhone && <NavButton onClick={() => onPrevNextClick(-12)}>&larr;{isPhone ? t("12 m") : t("12 months")}</NavButton>}
        <NavButton onClick={() => onPrevNextClick(-6)}>&larr;{isPhone ? t("6 m") : t("6 months")}</NavButton>
        {!hideMonthNav && <NavButton onClick={() => onPrevNextClick(-1)}>&larr;{formatDate(add(currentDate, {months: -1}), monthFormat)}
        </NavButton>}
      </Grid>
      <Grid item className="" sx={{alignSelf: "center"}}>
        <NavButton onClick={() => onChange(new Date())}>{t("Today")}</NavButton>
      </Grid>
      <Grid item className="forward-buttons" sx={{alignSelf: "right"}}>
        {!hideMonthNav && <NavButton onClick={() => onPrevNextClick(1)}>
          {formatDate(add(currentDate, {months: 1}), monthFormat)}&rarr;
        </NavButton>}
        <NavButton onClick={() => onPrevNextClick(6)}>{isPhone ? t("6 m") : t("6 months")}&rarr;</NavButton>
        {!isPhone && <NavButton onClick={() => onPrevNextClick(12)}>{isPhone ? t("12 m") : t("12 months")}&rarr;</NavButton>}
      </Grid>
    </Grid>
  );
};

export default DateNavBar;
