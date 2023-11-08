import React from "react";
import Page from "../../layouts/Main/Page";
import { Outlet } from "react-router-dom";

const Settings = () => {
  return (
    // <Page sx={{ display: "flex", flexFlow: "column" }}>
    <Outlet />
    // </Page>
  );
};

export default Settings;
