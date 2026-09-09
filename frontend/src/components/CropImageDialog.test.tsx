import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../common/testRender";
import CropImageDialog from "./CropImageDialog";

const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAoMBgDTD2qgAAAAASUVORK5CYII=";

describe("CropImageDialog", () => {
  it("renders the crop dialog with aspect-ratio presets and actions", () => {
    renderWithProviders(<CropImageDialog imgSrc={png} onCancel={vi.fn()} onCrop={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "16/9" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Square" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crop/ })).toBeInTheDocument();
  });

  it("calls onCancel from the Cancel button", async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CropImageDialog imgSrc={png} onCancel={onCancel} onCrop={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
