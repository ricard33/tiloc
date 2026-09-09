import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import NewAccountWizard from "./NewAccountWizard";

vi.mock("axios");
beforeEach(() => (axios as any).mockImplementation(async () => ({ data: { count: 0, results: [] }, status: 200 })));
afterEach(() => vi.clearAllMocks());

describe("NewAccountWizard", () => {
  it("renders the 4-step stepper and starts on the profile step", async () => {
    renderWithProviders(<NewAccountWizard />, {
      user: { id: 1, address: "1 rue du Test", permissions: [] },
      account: { id: "acme" },
    });

    expect(screen.getByText("Complete your profile")).toBeInTheDocument();
    expect(screen.getByText("Create your first lodging")).toBeInTheDocument();
    expect(screen.getByText("Prefill your contracts")).toBeInTheDocument();
    // step 0 content = the profile form
    expect(await screen.findByText("User")).toBeInTheDocument();
  });
});
