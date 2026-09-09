import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../../../common/testRender";
import { DateNavBar } from "./index";

describe("DateNavBar", () => {
  const date = new Date("2026-06-15");

  it("jumps to today", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<DateNavBar date={date} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Today" }));
    const arg = onChange.mock.calls[0][0] as Date;
    expect(arg.toDateString()).toEqual(new Date().toDateString());
  });

  it("shifts forward by 6 months", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<DateNavBar date={date} onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /6 months→/ }));
    expect((onChange.mock.calls[0][0] as Date).getMonth()).toEqual(11); // June -> December
  });

  it("hides the month buttons when hideMonthNav is set", () => {
    renderWithProviders(<DateNavBar date={date} onChange={vi.fn()} hideMonthNav />);
    expect(screen.queryByRole("button", { name: /1 month/ })).not.toBeInTheDocument();
  });
});
