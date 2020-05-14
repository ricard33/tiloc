import React from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const PlanningCalendar = props => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <PlanningNavbar/>
      <CalendarRow></CalendarRow>
    </div>
  );
};

PlanningCalendar.defaultProps = {
  numberOfMonths: 12
};

PlanningCalendar.propTypes = {
  beginDate: PropTypes.instanceOf(Date).isRequired,
  numberOfMonths: PropTypes.number,
};

export default PlanningCalendar;
