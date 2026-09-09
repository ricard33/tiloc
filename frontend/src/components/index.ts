import { styled } from "@mui/material/styles";
import Grid2 from "@mui/material/Unstable_Grid2";
import { Chip } from "@mui/material";

export { default as BookingDialog } from './BookingDialog';
export { default as BookingsImportDialog } from './BookingsImportDialog';
export { default as SearchInput } from './SearchInput';
export { default as RouteWithLayout } from './RouteWithLayout';
export { HtmlTooltip } from './Tooltip';
export { default as BookingQuickView } from './BookingQuickView';

export const Label = styled(Grid2)(() => ({
  color: "#7a7a7a"
}));

export const Value = styled(Grid2)(() => ({
  color: "#646464",
  textAlign: "right",
  fontWeight: "bold"
}));

export const HighlightBadge = styled(Chip)(() => ({
  borderRadius: "7px",
  position: "relative",
  overflow: "hidden",
  "&::before": {
    animation: "badgeHighlightShimmer 3.5s",
    animationDelay: "1.8s",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-out",
    background: "linear-gradient(180deg,rgba(130,130,130,0) 0,rgba(130,130,130,.2) 25%,rgba(130,130,130,.3) 50%,rgba(130,130,130,.2) 75%,rgba(130,130,130,0))",
    content: "\"\"",
    display: "block",
    height: "90px",
    left: "-60%",
    position: "absolute",
    top: "-150px",
    transform: "rotate(-25deg)",
    width: "200px"
  },
  "@keyframes badgeHighlightShimmer": {
    "0%": {
      left: "-100%",
      top: "-150px"
    },

    "50%": {
      left: "100%",
      top: "150px"
    },

    to: {
      left: "100%",
      top: "150px"
    }
  }

}));
