import { Stack, StackProps } from "@mui/material";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";
import React, { FC } from "react";
import { Feature } from "./subscription_types";

type Props = {
  features: Feature[];
};

const FeaturesList: FC<Props & StackProps>= ({ features, ...stackProps }: Props) => {

  return (
    <Stack sx={{ textAlign: "left", marginTop: 3 }} {...stackProps}>
      {features.map((value, index) => {
        return <Typography key={index} variant={"body1"} sx={{ verticalAlign: "top", height: "2em" }}>
          {typeof value.available !== "undefined" && (
            value.available
              ? <CheckCircleOutlineIcon color={"success"} sx={{ marginRight: 1 }} />
              : <HighlightOffIcon color={"error"} sx={{ marginRight: 1 }} />
          )}
          {typeof value.count !== "undefined" &&
            <span
              style={{ verticalAlign: "top", fontWeight: "bold", marginLeft: 8, marginRight: 8 }}
            >{value.count}</span>}
          <span style={{ verticalAlign: "top" }}>{value.label}</span>
        </Typography>;
      })}
    </Stack>
  );
};

export default FeaturesList;
