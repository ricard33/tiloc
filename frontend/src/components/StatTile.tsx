import React from "react";
import { Card, CardContent, Stack, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

type Props = {
  label: string;
  value: string | number;
  tooltip?: React.ReactNode;
  className?: string;
};

/** A single headline figure with its label — see the `dataviz` skill's stat-tile contract. */
const StatTile: React.FC<Props> = ({ label, value, tooltip, className }) => (
  <Card className={className} sx={{ height: "100%" }}>
    <CardContent>
      <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
        <Typography color="textSecondary" variant="body2">
          {label}
        </Typography>
        {tooltip && (
          <Tooltip title={tooltip} arrow>
            <InfoOutlinedIcon color="disabled" sx={{ fontSize: 16 }} />
          </Tooltip>
        )}
      </Stack>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

export default StatTile;
