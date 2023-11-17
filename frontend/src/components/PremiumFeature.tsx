import React from "react";
import Page from "../layouts/Main/Page";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";

type Props = {};

export const PremiumFeature: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();

  return (
    <Page sx={{ backgroundColor: "white", color: "black" }}>
      <Typography color="inherit">
        <WorkspacePremiumIcon
          color="warning"
          fontSize="large"
        />
        {t("Premium feature")}
      </Typography>
      <p><em>{t("This feature is only available to users on Essential or Professional plans.")}</em></p>
      <p>&nbsp;</p>
      <Button component={Link} to="/upgrade-plan" variant="contained">{t("Upgrade plan")}</Button>
    </Page>
  );

};
