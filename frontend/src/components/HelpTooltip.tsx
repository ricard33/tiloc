import * as React from "react";
import { PropsWithChildren, useState } from "react";
import { Badge, Tooltip } from "@mui/material";


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
    <Tooltip title={helpContent} open={open} onClose={() => setOpen(false)} arrow disableTouchListener>
      <Badge
        badgeContent={"?"} onClick={() => setOpen(!open)} color="primary"
        style={{ cursor: "pointer", ...(fullWidth && { width: "100%" }) }}
      >
        {children}
      </Badge>
    </Tooltip>

  );
}
