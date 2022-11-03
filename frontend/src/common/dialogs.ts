import { ConfirmOptions, useConfirm } from "../libs/MuiConfirm";
import { useTranslation } from "react-i18next";

export const useUnsavedChangesConfirm = () => {
  const confirm = useConfirm();
  const { t } = useTranslation();

  return (options?: ConfirmOptions) => {
    return confirm({
      ...options,
      title: t("Unsaved changes detected"),
      description: t("Some modifications aren't saved. Do you really want to leave this page?"),
      confirmationText: t("Leave Page"),
      confirmationButtonProps: {color: "warning"},
      cancellationText: t("Stay on Page"),
    });
  };
};
