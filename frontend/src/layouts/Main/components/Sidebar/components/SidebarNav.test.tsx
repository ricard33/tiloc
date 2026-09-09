import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { renderWithProviders } from "../../../../../common/testRender";
import SidebarNav from "./SidebarNav";

const LocationProbe = () => <span data-testid="pathname">{useLocation().pathname}</span>;

const pages = [
  { title: "Dashboard", href: "/", icon: <span>d</span> },
  { title: "Payments", href: "/payments", icon: <span>p</span>, premium: true },
  { title: "Disabled", href: "/nope", icon: <span>x</span>, disabled: true },
];

describe("SidebarNav", () => {
  it("renders a link per page", () => {
    renderWithProviders(<SidebarNav pages={pages} />);
    expect(screen.getByRole("link", { name: /Dashboard/ })).toHaveAttribute("href", "/");
  });

  it("routes premium pages to the upgrade screen", () => {
    renderWithProviders(<SidebarNav pages={pages} />);
    expect(screen.getByRole("link", { name: /Payments/ })).toHaveAttribute("href", "/upgrade-plan");
  });

  it("prevents navigation on a disabled link", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <SidebarNav pages={pages} />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </>,
      { route: "/start" }
    );

    await user.click(screen.getByRole("link", { name: /Disabled/ }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/start");

    await user.click(screen.getByRole("link", { name: /Dashboard/ }));
    expect(screen.getByTestId("pathname")).toHaveTextContent("/");
  });
});
