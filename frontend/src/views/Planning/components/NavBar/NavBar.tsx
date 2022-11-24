/* eslint-disable react/no-multi-comp */
import React, { useState } from "react";
import { Grid } from "@mui/material";
import { add, startOfMonth } from "date-fns";
import { useTranslation } from "react-i18next";
import Button from "@mui/material/Button";
import { formatDate } from "../../../../common/dateUtils";
import useWindowDimensions from "../../../../common/windowDimensions";
import { ButtonProps } from "@mui/material/Button/Button";

interface NavButtonProps extends ButtonProps {
  children?: React.ReactNode;
}

const NavButton: React.FC<NavButtonProps> = (props) => {
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


type NavBarProps = {
  date: Date,
  onChange: (newDate: Date) => void,
};


const NavBar: React.FC<NavBarProps> = props => {
  const {date, onChange} = props;
  const [currentDate, setCurrentDate] = useState(startOfMonth(date));
  const { t } = useTranslation();
  const { width: windowWidth } = useWindowDimensions();
  const isPhone = windowWidth < 600;
  const monthFormat = isPhone ? "MMM" : "MMMM Y";

  const onPrevNextClick = (months: number) => {
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

export default NavBar;
