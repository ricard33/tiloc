import React, { useContext } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { WizardContext } from "./WizardContext";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";
import { MobileStepper, Stack } from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

type Props = {
  onNext?: () => void;
  onSkip?: () => void;
  onReset?: () => void;
};

export const WizardFooter: React.FC<Props> = ({ onNext, onSkip, onReset }: Props) => {
  const wizardContext = useContext(WizardContext);
  const { t } = useTranslation();
  const theme = useTheme();
  const { activeStep, steps, isStepOptional, isMobile, onBack } = wizardContext;
  const formContext = useFormContext();
  const nbSteps = steps.length;

  return !isMobile ?
    <Stack direction={"row"} spacing={2} sx={{ paddingTop: 2, }}>
      <Button
        color="inherit"
        variant="contained"
        disabled={activeStep === 0}
        onClick={onBack}
        sx={{ mr: 1 }}
      >
        {t("Back")}
      </Button>
      <Box sx={{ flex: "1 1 auto" }} />
      {isStepOptional(activeStep) && (
        <Button color="inherit" onClick={onSkip} sx={{ mr: 1 }} variant="contained">
          {t("Skip")}
        </Button>
      )}
      {onReset &&
        <Button onClick={onReset} variant="contained">
          {t("Reset")}
        </Button>
      }
      {formContext ?
        <Button type="submit" variant="contained">
          {activeStep === steps.length - 1 ? t("Finish") : t("Next")}
        </Button>
        :
        <Button onClick={onNext} variant="contained">
          {activeStep === steps.length - 1 ? t("Finish") : t("Next")}
        </Button>
      }
    </Stack>
    :
    <MobileStepper
      variant="text"
      steps={nbSteps}
      position="static"
      activeStep={activeStep}
      nextButton={
        <Button
          size="small"
          type={formContext ? "submit" : "button"}
          onClick={formContext ? undefined : onNext}
          disabled={activeStep === nbSteps - 1}
        >
          {activeStep === steps.length - 1 ? t("Finish") : t("Next")}
          {theme.direction === "rtl" ? (
            <KeyboardArrowLeft />
          ) : (
            <KeyboardArrowRight />
          )}
        </Button>
      }
      backButton={
        <Button size="small" onClick={onBack} disabled={activeStep === 0}>
          {theme.direction === "rtl" ? (
            <KeyboardArrowRight />
          ) : (
            <KeyboardArrowLeft />
          )}
          Back
        </Button>
      }
    />;
};
