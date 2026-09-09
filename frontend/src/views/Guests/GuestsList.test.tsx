import React from "react";
import { screen } from "@testing-library/react";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import GuestsList from "./GuestsList";

vi.mock("axios");

const guests = [
  { name: "John Traveller", contact: "john@example.com", address: "1 Main St" },
  { name: "Jane Visitor", contact: "0612345678", address: "2 Side St" },
];

beforeEach(() => (axios as any).mockImplementation(async () => ({ data: guests, status: 200 })));
afterEach(() => vi.clearAllMocks());

describe("GuestsList", () => {
  it("lists every guest returned by the API", async () => {
    renderWithProviders(<GuestsList />, { user: { permissions: [] } });
    expect(await screen.findByText("John Traveller")).toBeInTheDocument();
    expect(screen.getByText("Jane Visitor")).toBeInTheDocument();
    expect(screen.getByText("1 Main St")).toBeInTheDocument();
  });
});
