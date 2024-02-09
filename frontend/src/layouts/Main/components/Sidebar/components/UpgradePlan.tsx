import React from "react";
import { Button, colors, Typography } from "@mui/material";
import ResumeFolderSvg from "../../../../../assets/images/undraw_resume_folder_2_arse.svg";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";


const UpgradePlan = () => {
  const { t } = useTranslation();

  return (
    <Box sx={{ backgroundColor: colors.grey[50] }}>
      <Box
        sx={{
          paddingTop: 2,
          height: "80px",
          textAlign: "center",
          "& > img": {
            height: "100%",
            width: "auto"
          }
        }}
      >
        <img
          alt={t("Upgrade to PRO")}
          src={ResumeFolderSvg}
        />
      </Box>
      <Box sx={{ padding: (theme) => theme.spacing(1, 2) }}>
        <Typography
          align="center"
          gutterBottom
          variant="h6"
        >
          {t("Upgrade to PRO")}
        </Typography>
        <Typography
          align="center"
          variant="body2"
        >
          {t("Upgrade your Tiloc subscription and get Premium features")}
        </Typography>
      </Box>
      <Box sx={{ padding: (theme) => theme.spacing(1, 2), display: "flex", justifyContent: "center" }}>
        <Button
          color="primary"
          component={Link}
          to="/upgrade-plan"
          variant="contained"
        >
          {t("Upgrade")}
        </Button>
      </Box>
    </Box>
  );
};

export default UpgradePlan;
