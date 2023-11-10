import React, { useContext } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { WizardContext } from "./WizardContext";
import { useTranslation } from "react-i18next";
import { useFormContext } from "react-hook-form";

type Props = {
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onReset?: () => void;
};

export const WizardFooter: React.FC<Props> = ({ onBack, onNext, onSkip, onReset }: Props) => {
  const wizardContext = useContext(WizardContext);
  const { t } = useTranslation();
  const { activeStep, steps, isStepOptional } = wizardContext;
  const formContext = useFormContext();

  return (
    <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
      <Button
        color="inherit"
        disabled={activeStep === 0}
        onClick={onBack}
        sx={{ mr: 1 }}
      >
        {t("Back")}
      </Button>
      <Box sx={{ flex: "1 1 auto" }} />
      {isStepOptional(activeStep) && (
        <Button color="inherit" onClick={onSkip} sx={{ mr: 1 }}>
          {t("Skip")}
        </Button>
      )}
      { onReset &&
        <Button onClick={onReset}>
          {t("Reset")}
        </Button>
      }
      {formContext ?
        <Button type="submit">
          {activeStep === steps.length - 1 ? t("Finish") : t("Next")}
        </Button>
        :
        <Button onClick={onNext}>
          {activeStep === steps.length - 1 ? t("Finish") : t("Next")}
        </Button>
      }
    </Box>
  );
};
