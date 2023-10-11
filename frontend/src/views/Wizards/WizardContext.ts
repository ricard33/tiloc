import { createContext } from 'react';

export const WizardContext = createContext({
  steps: [] as string[],
  activeStep: 1,
  isStepOptional: (stepIndex: number): boolean => false,
});
