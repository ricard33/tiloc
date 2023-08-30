import React from "react";
import { tooltipClasses, Tooltip, TooltipProps } from "@mui/material";
import { styled } from "@mui/material/styles";


const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: "rgba(0, 0, 0, 0.87)",
    boxShadow: theme.shadows[1],
    fontSize: 11,
    maxWidth: 900,
  },
}));

export default HtmlTooltip;
