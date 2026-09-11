import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { renderWithProviders } from "../common/testRender";
import LodgingSelector from "./LodgingSelector";

vi.mock("axios");
afterEach(() => vi.clearAllMocks());

const lodgings = [
  { id: 1, name: "Villa Rose", rank: 1, daily_rate: 100 },
  { id: 2, name: "Studio Blue", rank: 2, daily_rate: 60 },
];

describe("LodgingSelector", () => {
  beforeEach(() => {
    (axios as any).mockResolvedValue({ data: { count: lodgings.length, results: lodgings }, status: 200 });
  });

  it("shows the placeholder when no lodging is selected", async () => {
    renderWithProviders(<LodgingSelector value={[]} onChange={vi.fn()} />);
    expect(await screen.findByPlaceholderText("All lodgings")).toBeInTheDocument();
  });

  it("reports the selected lodging id when an option is picked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<LodgingSelector value={[]} onChange={onChange} />);

    const input = await screen.findByLabelText("Lodgings");
    await user.click(input);
    await user.click(await screen.findByText("Villa Rose"));

    expect(onChange).toHaveBeenCalledWith([1]);
  });
});
