import React from "react";
import { screen } from "@testing-library/react";
import { BookingSource, BookingStatusLabel, ChannelIcon } from "./statusUtils";
import { renderWithProviders } from "./testRender";
import type { Booking, BookingChannel } from "../types";

describe("statusUtils components", () => {
  describe("<BookingSource>", () => {
    it("shows the OTA name for a known channel", () => {
      renderWithProviders(<BookingSource name="Airbnb" />);
      expect(screen.getByText("Airbnb")).toBeInTheDocument();
    });

    it("falls back to 'Direct booking' when no name is given", () => {
      renderWithProviders(<BookingSource />);
      expect(screen.getByText("Direct booking")).toBeInTheDocument();
    });

    it("shows an unknown channel name verbatim", () => {
      renderWithProviders(<BookingSource name="MyOwnSite" />);
      expect(screen.getByText("MyOwnSite")).toBeInTheDocument();
    });
  });

  describe("<BookingStatusLabel>", () => {
    it("renders the localised label for a regular status", () => {
      renderWithProviders(<BookingStatusLabel booking={{ status: "paid" } as Booking} />);
      expect(screen.getByText("Paid")).toBeInTheDocument();
    });

    it("renders the OTA name for an external booking", () => {
      renderWithProviders(
        <BookingStatusLabel booking={{ status: "external", source: { name: "Airbnb" } } as Booking} />
      );
      expect(screen.getByText("Airbnb")).toBeInTheDocument();
    });
  });

  describe("<ChannelIcon>", () => {
    it("renders the branded icon (not the fallback) for a known channel", () => {
      renderWithProviders(<ChannelIcon channel={{ name: "Booking.com" } as BookingChannel} />);
      expect(screen.queryByTestId("QuestionMarkIcon")).not.toBeInTheDocument();
    });

    it("renders a question-mark icon for an unknown channel", () => {
      renderWithProviders(<ChannelIcon channel={{ name: "Nope" } as BookingChannel} />);
      expect(screen.getByTestId("QuestionMarkIcon")).toBeInTheDocument();
    });
  });
});
