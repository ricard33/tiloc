import * as React from "react";
import Box from "@mui/material/Box";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Typography from "@mui/material/Typography";
import { Trans, useTranslation } from "react-i18next";
import Paper from "@mui/material/Paper";
import { UserProfileWizardStep } from "./UserProfileWizardStep";
import { WizardContext } from "./WizardContext";
import { WizardFooter } from "./WizardFooter";
import { FirstLodgingWizardStep } from "./FirstLodgingWizardStep";
import { Link, useNavigate } from "react-router-dom";
import { Container } from "@mui/material";
import useWindowDimensions from "../../common/windowDimensions";
import { ContractWizardStep } from "./ContractWizardStep";


export default function NewAccountWizard() {
  const { t } = useTranslation();
  const [activeStep, setActiveStep] = React.useState(0);
  const navigate = useNavigate();
  const { width } = useWindowDimensions();
  const isMobile = width < 600;

  const steps = [
    t("Complete your profile"),
    t("Create your first lodging"),
    t("Prefill your contracts"),
    t("Finished")
  ];

  const isStepOptional = (step: number) => {
    // return step === 1;
    return false;
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const renderStep = () => {
    if (activeStep === 0)
      return (
        <UserProfileWizardStep
          onNext={() => handleNext()} canChangeEmail={false}
          canChangePassword={false}
        />);
    else if (activeStep === 1)
      return <FirstLodgingWizardStep onNext={() => handleNext()}  />;
    else if (activeStep === 2)
      return <ContractWizardStep onNext={() => handleNext()}  />;
    else if (activeStep === steps.length - 1) // Last one ?
      return (
        <>
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

          <WizardFooter onNext={() => navigate("/")} onReset={handleReset} />
        </>
      );
    else
      return (
        <>
          <Typography sx={{ mt: 2, mb: 1 }}>Step {activeStep + 1}</Typography>
          <WizardFooter onNext={handleNext} />
        </>
      );
  };

  return (
    <WizardContext.Provider value={{ steps, activeStep, isStepOptional, isMobile, onBack: handleBack }}>
      <Container maxWidth={false} style={isMobile ? {padding: 0} : {}}>
        <Paper sx={{ padding: isMobile ? 0 : "1em" }}>
          <Box sx={{ width: "100%" }}>
            {!isMobile ?
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
                  return (
                    <Step key={label} {...stepProps}>
                      <StepLabel {...labelProps}>{label}</StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
              :
              <Paper
                square
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  height: 50,
                  pl: 2,
                  bgcolor: "background.default"
                }}
              >
                <Typography>{steps[activeStep]}</Typography>
              </Paper>
            }
            <Container maxWidth={"md"} style={{padding: isMobile ? "0" : "2px 0"}}>
              {renderStep()}
            </Container>
          </Box>
        </Paper>
      </Container>
    </WizardContext.Provider>

  );
}
