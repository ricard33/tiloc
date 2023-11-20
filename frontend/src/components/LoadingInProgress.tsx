import React from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import Box from "@mui/material/Box";

const LoadingInProgress = () => {
  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 1000,
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Backdrop
        open
        sx={{
          position: "absolute",
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Box>);
};

export default LoadingInProgress;
