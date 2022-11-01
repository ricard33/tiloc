import React from "react";
import Tooltip, { TooltipProps } from "@mui/material/Tooltip";
import { styled } from "@mui/material/styles";
import { tooltipClasses } from "@mui/material";


const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: "rgba(0, 0, 0, 0.87)",
    boxShadow: theme.shadows[1],
    fontSize: 11,
    maxWidth: 500,
  },
}));

export default HtmlTooltip;
