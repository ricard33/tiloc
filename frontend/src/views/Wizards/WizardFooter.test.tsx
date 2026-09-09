import React from "react";
import { screen } from "@testing-library/react";
import { FormProvider, useForm } from "react-hook-form";
import { renderWithProviders } from "../../common/testRender";
import { WizardFooter } from "./WizardFooter";
import { WizardContext } from "./WizardContext";

const ctx = (over = {}) => ({
  steps: ["a", "b", "c"],
  activeStep: 1,
  isStepOptional: () => false,
  isMobile: false,
  onBack: vi.fn(),
  ...over,
});

const renderFooter = (contextValue: any, props = {}, withForm = false) => {
  const inner = <WizardFooter {...props} />;
  const Tree = () => {
    const methods = useForm();
    return (
      <WizardContext.Provider value={contextValue}>
        {withForm ? <FormProvider {...methods}>{inner}</FormProvider> : inner}
      </WizardContext.Provider>
    );
  };
  return renderWithProviders(<Tree />);
};

describe("WizardFooter", () => {
  it("disables Back on the first step", () => {
    renderFooter(ctx({ activeStep: 0 }));
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
  });

  it("shows a Next button on a middle step and Finish on the last", () => {
    renderFooter(ctx({ activeStep: 1 }));
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();

    renderFooter(ctx({ activeStep: 2 }));
    expect(screen.getAllByRole("button", { name: "Finish" }).length).toBeGreaterThan(0);
  });

  it("shows a Skip button for an optional step", () => {
    renderFooter(ctx({ isStepOptional: () => true }));
    expect(screen.getByRole("button", { name: "Skip" })).toBeInTheDocument();
  });

  it("renders a submit button when inside a form context", () => {
    renderFooter(ctx(), {}, true);
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute("type", "submit");
  });
});
