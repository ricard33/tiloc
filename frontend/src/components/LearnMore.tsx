import * as React from "react";
import { PropsWithChildren, useState } from "react";
import { Button } from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";


type Props = {
  fullWidth?: boolean;
};

export default function LearnMore(props: PropsWithChildren<Props>) {
  const {
    fullWidth,
    children
  } = props;
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(!open)}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{textTransform: "none", fontWeight: "bold"}}
        fullWidth={fullWidth}
      >
        {t("Learn more")}
      </Button>
      {open && children}
    </>

  );
}
