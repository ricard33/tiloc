import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "./common/testRender";
import App from "./App";

vi.mock("axios");

beforeEach(() => {
  (axios as any).mockImplementation(async (config: any) => {
    if (String(config?.url ?? config ?? "").includes("info")) {
      return {
        data: {
          version: "1.0.0",
          build_date: "2026-09-01",
          can_register: true,
          is_debug: false,
          is_demo: false,
        },
      };
    }
    return { data: {}, status: 401 };
  });
  (axios.get as any).mockImplementation((url: string) => {
    if (url.includes("info")) {
      return Promise.resolve({
        data: { version: "1.0.0", build_date: "2026-09-01", can_register: true, is_debug: false, is_demo: false },
      });
    }
    return Promise.resolve({ data: {} });
  });
});
afterEach(() => vi.clearAllMocks());

describe("App", () => {
  it("loads app info then renders the router (login screen when signed out)", async () => {
    renderWithProviders(<App />, { user: null, router: false });

    // once /api/info/ resolves, appInfo.loaded flips and Routes renders
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(axios.get).toHaveBeenCalledWith("/api/info/");
  });
});
