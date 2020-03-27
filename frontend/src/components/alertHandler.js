import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { alert } from "../actions";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert from "@material-ui/lab/Alert";

export default function AlertHandler() {
  const error = useSelector(state => state.alert);
  const dispatch = useDispatch();

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    dispatch(alert.clearAlert());
  };

  return (error.severity !== undefined &&
    <Snackbar
      autoHideDuration={10000}
      onClose={handleClose}
      open={error.severity !== undefined}
    >
      <MuiAlert
        elevation={6}
        onClose={handleClose}
        severity={error.severity}
        variant="filled"
      >
        {error.message}
      </MuiAlert>
    </Snackbar>
  );
}
