import { colors, createTheme } from "@mui/material";
import { frFR } from "@mui/x-data-grid";

import palette from "./palette";
import typography from "./typography";

const theme = createTheme(
  {
    palette,
    typography,
    zIndex: {
      appBar: 1200,
      drawer: 1100
    },
    components: {
      MuiButton: {
        defaultProps: { size: "small", variant: "text" }
      },
      MuiFilledInput: {
        defaultProps: { margin: "dense" }
      },
      MuiFormControl: {
        // defaultProps: { margin: "dense" }
      },
      MuiFormHelperText: {
        defaultProps: { margin: "dense" }
      },
      MuiIconButton: {
        defaultProps: { size: "small" }
        // styleOverrides: {
        //   root: {
        //     color: palette.icon,
        //     "&:hover": {
        //       backgroundColor: "rgba(0, 0, 0, 0.03)"
        //     }
        //   }
        // }
      },
      MuiInputBase: {
        defaultProps: { margin: "dense" }
      },
      MuiInputLabel: {
        defaultProps: { margin: "dense" }
      },
      MuiListItem: {
        defaultProps: { dense: false }
      },
      MuiOutlinedInput: {
        defaultProps: { margin: "dense" }
      },
      MuiFab: {
        defaultProps: { size: "small" }
      },
      MuiTable: {
        defaultProps: { size: "small" }
      },
      MuiTextField: {
        // defaultProps: { margin: "dense" }
      },
      MuiToolbar: {
        defaultProps: { variant: "dense" }
      },
      MuiPaper: {
        styleOverrides: {
          elevation1: {
            // boxShadow: "0 0 0 1px rgba(63,63,68,0.05), 0 1px 3px 0 rgba(63,63,68,0.15)"
          }
        }
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            backgroundColor: colors.grey[50]
          }
        }
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&$selected": {
              backgroundColor: palette.background.default
            },
            "&$hover": {
              "&:hover": {
                backgroundColor: palette.background.default
              }
            }
          }
        }
      },
      MuiTypography: {
        styleOverrides: {
          gutterBottom: {
            marginBottom: 8
          }
        }
      }

    }
  },
  frFR
);

export default theme;
