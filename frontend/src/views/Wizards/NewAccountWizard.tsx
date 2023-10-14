import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { Trans, useTranslation } from "react-i18next";
import Paper from "@mui/material/Paper";
import { MyProfile } from "./MyProfile";
import { WizardContext } from "./WizardContext";
import { WizardFooter } from "./WizardFooter";
import { FirstLodgingForm } from "./FirstLodgingForm";
import { Link } from "react-router-dom";


export default function NewAccountWizard() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = React.useState(0);
  const [skipped, setSkipped] = React.useState(new Set<number>());

  const steps = [
    t("Complete your profile"),
    t("Create your first lodging"),
  ];

  const isStepOptional = (step: number) => {
    // return step === 1;
    return false;
  };

  const isStepSkipped = (step: number) => {
    return skipped.has(step);
  };

  const handleNext = () => {
    let newSkipped = skipped;
    if (isStepSkipped(activeStep)) {
      newSkipped = new Set(newSkipped.values());
      newSkipped.delete(activeStep);
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped(newSkipped);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkip = () => {
    if (!isStepOptional(activeStep)) {
      // You probably want to guard against something like this,
      // it should never occur unless someone's actively trying to break something.
      throw new Error("You can't skip a step that isn't optional.");
    }

    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setSkipped((prevSkipped) => {
      const newSkipped = new Set(prevSkipped.values());
      newSkipped.add(activeStep);
      return newSkipped;
    });
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const renderStep = () => {
    if (activeStep === 0)
      return <MyProfile onNext={() => handleNext()} onBack={handleBack} canChangeEmail={false} canChangePassword={false} />;
    else if (activeStep === 1)
      return <FirstLodgingForm onNext={() => handleNext()} onBack={handleBack} />;
    else
      return (
        <>
          <Typography sx={{ mt: 2, mb: 1 }}>Step {activeStep + 1}</Typography>
          <WizardFooter onBack={handleBack} onNext={handleNext} onSkip={handleSkip}/>
        </>
      );
  };

  return (
    <WizardContext.Provider value={{ steps, activeStep, isStepOptional }}>
      <Paper sx={{ padding: "1em" }}>
        <Box sx={{ width: "100%" }}>
          <Stepper activeStep={activeStep}>
            {steps.map((label, index) => {
              const stepProps: { completed?: boolean } = {};
              const labelProps: {
                optional?: React.ReactNode;
              } = {};
              if (isStepOptional(index)) {
                labelProps.optional = (
                  <Typography variant="caption">Optional</Typography>
                );
              }
              if (isStepSkipped(index)) {
                stepProps.completed = false;
              }
              return (
                <Step key={label} {...stepProps}>
                  <StepLabel {...labelProps}>{label}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
          {activeStep === steps.length ? (
            <React.Fragment>
              <Typography sx={{ mt: 2, mb: 1 }}>
                {t("All steps completed - you're finished")}
              </Typography>
              <Typography sx={{ mt: 2, mb: 1 }}>
                <Trans
                  i18nKey="Now, you can have a look to your <link1>planning</link1>
                  or go to your <link2>dashboard</link2>"
                  components={{
                    link1: <Link to="/planning" title={t("Planning")}> </Link>,
                    link2: <Link to="/" title={t("Dashboard")}> </Link>
                  }}
                />
              </Typography>

              <Box sx={{ display: "flex", flexDirection: "row", pt: 2 }}>
                <Box sx={{ flex: "1 1 auto" }} />
                <Button onClick={handleReset}>Reset</Button>
              </Box>
            </React.Fragment>
          ) : (
            <React.Fragment>
              {renderStep()}
            </React.Fragment>
          )}
        </Box>
      </Paper>
    </WizardContext.Provider>

  );
}
