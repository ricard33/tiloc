import React from "react";

import { Topbar } from "./components";
import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";


const Minimal = () => {

  return (
    <Box sx={{ height: "100%" }}>
      <Topbar />
      <main style={{ height: "100%" }}>
        <Outlet />
      </main>
    </Box>
  );
};

export default Minimal;
