import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { FormContainer } from "react-hook-form-mui";
import { LodgingSeasonRates } from "./LodgingSeasonRates";
import type { LodgingSeasonRateRow, SeasonCalendar } from "../../types";

// LodgingSeasonRates has no API calls of its own: it reads/writes the parent form's
// `season_rates` field directly, so a minimal FormContainer stands in for the real
// LodgingForm it normally lives inside.
const Harness: React.FC<{ calendar?: SeasonCalendar; onSubmitValues?: (rows: LodgingSeasonRateRow[]) => void }> = ({
  calendar,
  onSubmitValues
}) => {
  const formContext = useForm({ defaultValues: { season_rates: [] as LodgingSeasonRateRow[] } });
  return (
    <FormContainer
      formContext={formContext}
      onSuccess={(values: any) => onSubmitValues?.(values.season_rates)}
    >
      <LodgingSeasonRates calendar={calendar} />
      <button type="submit">Submit</button>
    </FormContainer>
  );
};

const calendar = {
  id: 1,
  name: "Standard",
  notes: "",
  seasons: [
    { id: 10, name: "High", color: "#f00", rank: 0, date_ranges: [] },
    { id: 11, name: "Low", color: "#0f0", rank: 1, date_ranges: [] }
  ]
} as unknown as SeasonCalendar;

const otherCalendar = {
  id: 2,
  name: "Other",
  notes: "",
  seasons: [{ id: 20, name: "Peak", color: "#00f", rank: 0, date_ranges: [] }]
} as unknown as SeasonCalendar;

describe("LodgingSeasonRates", () => {
  it("prompts for a season calendar when none is selected", () => {
    render(<Harness />);
    expect(screen.getByText("Select a season calendar above to set per-season rates.")).toBeInTheDocument();
  });

  it("shows one blank row per season of the selected calendar", () => {
    render(<Harness calendar={calendar} />);
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText("Low")).toBeInTheDocument();
    const nightlyRateInputs = screen.getAllByRole("spinbutton").filter((_, i) => i % 3 === 0);
    expect(nightlyRateInputs).toHaveLength(2);
  });

  it("includes the entered rates in the submitted form values, without any API call", async () => {
    const user = userEvent.setup();
    const onSubmitValues = vi.fn();
    render(<Harness calendar={calendar} onSubmitValues={onSubmitValues} />);

    const rows = screen.getAllByRole("row").slice(1); // drop the header row
    const highInputs = rows[0].querySelectorAll("input");
    await user.type(highInputs[0], "180");
    await user.type(highInputs[1], "220");
    await user.type(highInputs[2], "3");

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(onSubmitValues).toHaveBeenCalledWith([
      { season: 10, nightly_rate: 180, weekend_rate: 220, min_nights: 3 },
      { season: 11, nightly_rate: "", weekend_rate: "", min_nights: "" }
    ]);
  });

  it("rebuilds the rows when the calendar changes, dropping values for seasons no longer shown", async () => {
    const user = userEvent.setup();
    const onSubmitValues = vi.fn();
    const { rerender } = render(<Harness calendar={calendar} onSubmitValues={onSubmitValues} />);

    const firstRowInput = screen.getAllByRole("row")[1].querySelector("input") as HTMLInputElement;
    await user.type(firstRowInput, "180");

    rerender(<Harness calendar={otherCalendar} onSubmitValues={onSubmitValues} />);

    expect(screen.queryByText("High")).not.toBeInTheDocument();
    expect(screen.getByText("Peak")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(onSubmitValues).toHaveBeenCalledWith([{ season: 20, nightly_rate: "", weekend_rate: "", min_nights: "" }]);
  });
});
