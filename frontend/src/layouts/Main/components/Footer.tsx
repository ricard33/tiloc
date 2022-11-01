import React from "react";
import PropTypes from "prop-types";
import { Box, Link, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      sx={{
        padding: (theme) => theme.spacing(3),
        paddingTop: (theme) => theme.spacing(1),
        paddingBottom: (theme) => theme.spacing(1),
      }}
    >
      <Typography variant="body1">
        &copy;{" "}
        <Link
          component="a"
          href="https://ti-gecko.fr/"
          target="_blank"
        >
          Ti'Gecko
        </Link>
        . 2020-{new Date().getFullYear()}
      </Typography>
      <Typography variant="caption">
        Created with love for the environment.
      </Typography>
    </Box>
  );
};

Footer.propTypes = {
  className: PropTypes.string
};

export default Footer;
