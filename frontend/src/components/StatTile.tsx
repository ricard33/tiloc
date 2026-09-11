import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

type Props = {
  label: string;
  value: string | number;
  className?: string;
};

/** A single headline figure with its label — see the `dataviz` skill's stat-tile contract. */
const StatTile: React.FC<Props> = ({ label, value, className }) => (
  <Card className={className} sx={{ height: "100%" }}>
    <CardContent>
      <Typography color="textSecondary" gutterBottom variant="body2">
        {label}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);

export default StatTile;
