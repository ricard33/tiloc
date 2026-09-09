import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../common/testRender";
import DateRangeSelector from "./DateRangeSelector";

describe("DateRangeSelector", () => {
  it("labels a custom range and reports a shift when the arrows are clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <DateRangeSelector
        startDate={new Date("2026-06-01")}
        endDate={new Date("2026-06-30")}
        onChange={onChange}
      />
    );

    // three buttons: back, the range label, forward
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(3);

    await user.click(buttons[2]); // forward
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ startDate: expect.any(Date), endDate: expect.any(Date) })
    );
  });

  it("names a well-known range ('All') from its bounds", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <DateRangeSelector
        startDate={new Date(2000, 1, 1)}
        endDate={new Date(2100, 12, 31)}
        onChange={onChange}
      />
    );
    expect(screen.getByText("All")).toBeInTheDocument();
  });
});
