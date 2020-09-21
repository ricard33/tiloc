import palette from "./palette";

export default {
  // fontFamily: "\"Roboto\", \"Helvetica\", \"Arial\", sans-serif",
  fontFamily: [
    "-apple-system",
    "BlinkMacSystemFont",
    "\"Segoe UI\"",
    "Roboto",
    "\"Helvetica Neue\"",
    "Arial",
    "sans-serif",
    "\"Apple Color Emoji\"",
    "\"Segoe UI Emoji\"",
    "\"Segoe UI Symbol\""
  ].join(","),
  h1: {
  //   color: palette.text.primary,
    fontWeight: 500,
    fontSize: "2.5rem",
    // letterSpacing: "-0.24px",
  //   lineHeight: "40px"
  },
  h2: {
  //   color: palette.text.primary,
    fontWeight: 500,
    fontSize: "2rem",
  //   letterSpacing: "-0.24px",
  //   lineHeight: "32px"
  },
  h3: {
  //   color: palette.text.primary,
    fontWeight: 500,
    fontSize: "1.5rem",
  //   letterSpacing: "-0.06px",
  //   lineHeight: "28px"
  },
  h4: {
  //   color: palette.text.primary,
    fontWeight: 500,
    fontSize: "1.2rem",
  //   letterSpacing: "-0.06px",
  //   lineHeight: "24px"
  },
  h5: {
  //   color: palette.text.primary,
    fontWeight: 500,
    fontSize: "1rem",
  //   letterSpacing: "-0.05px",
  //   lineHeight: "20px"
  },
  h6: {
  //   color: palette.text.primary,
    fontWeight: 500,
    fontSize: "0.9em",
  //   letterSpacing: "-0.05px",
  //   lineHeight: "20px"
  },
  // subtitle1: {
  //   color: palette.text.primary,
  //   fontSize: "16px",
  //   letterSpacing: "-0.05px",
  //   lineHeight: "25px"
  // },
  // subtitle2: {
  //   color: palette.text.secondary,
  //   fontWeight: 400,
  //   fontSize: "14px",
  //   letterSpacing: "-0.05px",
  //   lineHeight: "21px"
  // },
  body1: {
    color: palette.text.primary,
    fontSize: "0.85em",
    letterSpacing: "-0.05px",
    lineHeight: "21px"
  },
  body2: {
    color: palette.text.secondary,
    fontSize: "0.7em",
    letterSpacing: "-0.04px",
    lineHeight: "18px"
  },
  // button: {
  //   color: palette.text.primary,
  //   fontSize: "14px"
  // },
  // caption: {
  //   color: palette.text.secondary,
  //   fontSize: "11px",
  //   letterSpacing: "0.33px",
  //   lineHeight: "13px"
  // },
  // overline: {
  //   color: palette.text.secondary,
  //   fontSize: "11px",
  //   fontWeight: 500,
  //   letterSpacing: "0.33px",
  //   lineHeight: "13px",
  //   textTransform: "uppercase"
  // }
};
