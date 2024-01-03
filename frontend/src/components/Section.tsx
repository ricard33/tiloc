import React, { PropsWithChildren } from "react";
import {
  Accordion as MuiAccordion, AccordionDetails as MuiAccordionDetails,
  AccordionProps,
  AccordionSummary as MuiAccordionSummary,
  AccordionSummaryProps,
  Typography
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";

const Accordion = styled((props: AccordionProps) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0
  },
  "&::before": {
    display: "none"
  }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, .05)"
      : "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)"
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1)
  },
  "& .MuiAccordionSummary-content > svg": {
    margin: "0 8px"
  }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
  borderBottom: "1px solid rgba(0, 0, 0, .125)",
}));


export type SectionProps  = AccordionProps & {
  header: string;
  subHeader?: string;
  icon?: React.ReactNode;
};

export const Section = (props: PropsWithChildren<SectionProps>) => {
  const {header, subHeader, icon, children, ...accordionProps} = props;
  return <Accordion defaultExpanded {...accordionProps}>
    <AccordionSummary>
      {icon}
      <Typography sx={{ width: "80%", flexShrink: 0 }}>
        {header}
      </Typography>
      <Typography sx={{ color: "text.secondary" }}>
        {subHeader}
      </Typography>
    </AccordionSummary>
    <AccordionDetails>
      {children}
    </AccordionDetails>
  </Accordion>;
};
