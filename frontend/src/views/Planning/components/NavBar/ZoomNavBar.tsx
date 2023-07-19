/* eslint-disable react/no-multi-comp */
import React from "react";
import { Grid, Button, ButtonProps } from "@mui/material";
import { useTranslation } from "react-i18next";

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


type Props = {
  onChange: (monthsToDisplay: number) => void,
};


const ZoomNavBar: React.FC<Props> = props => {
  const { onChange } = props;
  const { t } = useTranslation();

  const onZoomClick = (months: number) => {
    onChange(months);
  };

  return (
    <Grid container justifyContent="center" gap="10px">
      <Grid item>
        <NavButton onClick={() => onZoomClick(0.5)}>{t("2 weeks")}</NavButton>
      </Grid>
      <Grid item>
        <NavButton onClick={() => onZoomClick(2)}>{t("2 months")}</NavButton>
      </Grid>
      <Grid item>
        <NavButton onClick={() => onZoomClick(6)}>{t("6 months")}</NavButton>
      </Grid>
      <Grid item>
        <NavButton onClick={() => onZoomClick(12)}>{t("1 year")}</NavButton>
      </Grid>
    </Grid>
  );
};

export default ZoomNavBar;
