import React from "react";
import { screen } from "@testing-library/react";
import { Route, Routes } from "react-router-dom";
import axios from "axios";
import { renderWithProviders } from "../../common/testRender";
import ContractEdit from "./ContractEdit";

vi.mock("axios");
vi.mock("../../components/Editor", () => ({
  default: (props: any) => (
    <textarea aria-label="editor" value={props.data ?? ""} onChange={(e) => props.onChange?.(e.target.value)} />
  ),
}));

beforeEach(() =>
  (axios as any).mockImplementation(async () => ({
    data: { id: 7, content: "<p>contract body</p>", booking: 5 },
    status: 200,
  }))
);
afterEach(() => vi.clearAllMocks());

const routes = (
  <Routes>
    <Route path="/contract/:bookingId" element={<ContractEdit />} />
    <Route path="/bookings" element={<div>bookings list</div>} />
  </Routes>
);

describe("ContractEdit", () => {
  it("generates the contract on mount and shows the editor with its actions", async () => {
    renderWithProviders(routes, { route: "/contract/5", user: { permissions: ["core.change_contract"] } });

    expect(await screen.findByLabelText("editor")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Regenerate" })).toBeInTheDocument();
    expect(
      (axios as any).mock.calls.some(([c]: any[]) => String(c.url).includes("get_or_create_contract"))
    ).toBe(true);
  });
});
