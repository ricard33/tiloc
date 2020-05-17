import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Tooltip from "@material-ui/core/Tooltip";

const useStylesBootstrap = makeStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.common.white,
    color: "rgba(0, 0, 0, 0.87)",
    boxShadow: theme.shadows[1],
    fontSize: 11
  }
}));

function HtmlTooltip(props) {
  const classes = useStylesBootstrap();

  return <Tooltip classes={classes} {...props} />;
}

export default HtmlTooltip;
