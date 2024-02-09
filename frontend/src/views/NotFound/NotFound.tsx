import React from "react";
import { Grid, Typography } from "@mui/material";
import PageNotFound from "../../assets/images/undraw_page_not_found_su7k.svg";
import Page from "../../layouts/Main/Page";

const NotFound = () => {
  return (
    <Page>
      <Grid
        container
        justifyContent="center"
        spacing={0}
      >
        <Grid
          item
        >
          <div style={{ paddingTop: "10vh", textAlign: "center" }}>
            <Typography variant="h3">
              404: The page you are looking for isn’t here
            </Typography>
            <Typography variant="subtitle2">
              You either tried some shady route or you came here by mistake.
              Whichever it is, try using the navigation
            </Typography>
            <img
              alt="Under development"
              style={{
                marginTop: "5vh",
                display: "inline-block",
                maxWidth: "100%",
                width: "30vw"
              }}
              src={PageNotFound}
            />
          </div>
        </Grid>
      </Grid>
    </Page>
  );
};

export default NotFound;
