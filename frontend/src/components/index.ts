import { styled } from "@mui/material/styles";
import Grid2 from "@mui/material/Unstable_Grid2";

export { default as BookingDialog } from './BookingDialog';
export { default as BookingsImportDialog } from './BookingsImportDialog';
export { default as SearchInput } from './SearchInput';
export { default as RouteWithLayout } from './RouteWithLayout';
export { default as StatusBullet } from './StatusBullet';
export { default as Tooltip } from './Tooltip';
export { HtmlTooltip } from './Tooltip';
export { default as BookingQuickView } from './BookingQuickView';

export const Label = styled(Grid2)(({ theme }) => ({
  color: "#7a7a7a"
}));
export const Value = styled(Grid2)(({ theme }) => ({
  color: "#646464",
  textAlign: "right",
  fontWeight: "bold"
}));
