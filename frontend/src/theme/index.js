import { createMuiTheme } from "@material-ui/core";

import palette from "./palette";
import typography from "./typography";
import overrides from "./overrides";

const theme = createMuiTheme({
  palette,
  typography,
  overrides,
  zIndex: {
    appBar: 1200,
    drawer: 1100
  },
  props: {
    MuiButton: {
      size: "small"
    },
    MuiFilledInput: {
      margin: "dense"
    },
    MuiFormControl: {
      margin: "dense"
    },
    MuiFormHelperText: {
      margin: "dense"
    },
    MuiIconButton: {
      size: "small"
    },
    MuiInputBase: {
      margin: "dense"
    },
    MuiInputLabel: {
      margin: "dense"
    },
    MuiListItem: {
      dense: false
    },
    MuiOutlinedInput: {
      margin: "dense"
    },
    MuiFab: {
      size: "small"
    },
    MuiTable: {
      size: "small"
    },
    MuiTextField: {
      margin: "dense"
    },
    MuiToolbar: {
      variant: "dense"
    }
  }

});

export default theme;
