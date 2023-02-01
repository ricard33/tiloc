import React from "react";
import { useTranslation } from "react-i18next";
import "./PageBreak.scss";

type PageBreakProps = {};

const PageBreak: React.FunctionComponent<PageBreakProps> = ({
  ...props
}: PageBreakProps) => {
  const { t } = useTranslation();

  return <div
    className="page-break"
    style={{ pageBreakAfter:"always" }}
  >
    <span
      className="page-break__label"
    >{t("Page break")}</span>
  </div>;
};

export default PageBreak;
