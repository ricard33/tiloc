import React from "react";
import { makeStyles } from "@mui/styles";
import { Button, colors, Theme, Typography } from "@mui/material";
import ResumeFolderSvg from "../../../../../assets/images/undraw_resume_folder_2_arse.svg";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    backgroundColor: colors.grey[50]
  },
  media: {
    paddingTop: theme.spacing(2),
    height: 80,
    textAlign: "center",
    "& > img": {
      height: "100%",
      width: "auto"
    }
  },
  content: {
    padding: theme.spacing(1, 2)
  },
  actions: {
    padding: theme.spacing(1, 2),
    display: "flex",
    justifyContent: "center"
  }
}));

const UpgradePlan = () => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <div
      className={classes.root}
    >
      <div className={classes.media}>
        <img
          alt={t("Upgrade to PRO")}
          src={ResumeFolderSvg}
        />
      </div>
      <div className={classes.content}>
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
      </div>
      <div className={classes.actions}>
        <Button
          color="primary"
          component={Link}
          to="/upgrade-plan"
          variant="contained"
        >
          {t("Upgrade")}
        </Button>
      </div>
    </div>
  );
};

export default UpgradePlan;
