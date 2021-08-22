import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import { Button, Toolbar } from "@material-ui/core";
import { lighten } from "@material-ui/core/styles/colorManipulator";
import { useTranslation } from "react-i18next";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import FilterListIcon from "@material-ui/icons/FilterList";
import Typography from "@material-ui/core/Typography";
import { NavLink } from "react-router-dom";

const useStyles = makeStyles(theme => ({
  root: { paddingRight: theme.spacing(1) },
  row: {
    height: "42px",
    display: "flex",
    alignItems: "center",
    marginTop: theme.spacing(1)
  },
  title: {
    flex: "0 0 auto",
    marginRight: theme.spacing(2)
  },
  spacer: {
    flexGrow: 1
  },
  highlight:
    theme.palette.type === "light"
      ? {
        color: theme.palette.secondary.main,
        backgroundColor: lighten(theme.palette.secondary.light, 0.85)
      }
      : {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.secondary.dark
      },
  actions: {
    color: theme.palette.text.secondary
  }

}));

const ContractTemplatesToolbar = props => {
  const { className, numSelected, ...rest } = props;

  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Toolbar
      {...rest}
      className={classNames(classes.root, {
        [classes.highlight]: numSelected > 0
      })}
    >
      <div className={classes.title}>
        {numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1">
            {t("{{count}} selected", {count: numSelected})}
          </Typography>
        ) : (
          <Typography variant="h3" id="tableTitle">
            {t("Contract templates")}
          </Typography>
        )}
      </div>
      <span className={classes.spacer}/>
      <div className={classes.actions}>
        <Button
          color="primary"
          variant="contained"
          component={NavLink}
          to="./contract-templates/new"
        >
          {t("Add template")}
        </Button>
        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton aria-label="Delete">
              <DeleteIcon/>
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton aria-label="Filter list">
              <FilterListIcon/>
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Toolbar>
  );
};

ContractTemplatesToolbar.propTypes = {
  className: PropTypes.string,
  numSelected: PropTypes.number
};

export default ContractTemplatesToolbar;
