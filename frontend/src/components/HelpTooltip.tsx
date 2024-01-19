import * as React from "react";
import { PropsWithChildren, useState } from "react";
import { Badge, Tooltip, tooltipClasses, TooltipProps } from "@mui/material";
import { styled } from "@mui/material/styles";



const CustomTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    // backgroundColor: theme.palette.common.white,
    backgroundColor: "#FF0",
    color: 'rgba(0, 0, 0, 0.87)',
    boxShadow: theme.shadows[1],
    fontSize: 14,
  },
}));

type Props = {
  helpContent: React.ReactNode;
  fullWidth?: boolean;
};

export default function HelpTooltip(props: PropsWithChildren<Props>) {
  const {
    helpContent,
    fullWidth,
    children
  } = props;
  const [open, setOpen] = useState(false);

  return (
    <CustomTooltip title={helpContent} open={open} onClose={() => setOpen(false)} arrow disableTouchListener>
      <Badge
        badgeContent={"?"} onClick={() => setOpen(!open)} color="primary"
        style={{ cursor: "pointer", ...(fullWidth && { width: "100%" }) }}
      >
        {children}
      </Badge>
    </CustomTooltip>

  );
}
