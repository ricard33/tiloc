import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import { Button, Toolbar } from "@material-ui/core";
import { SearchInput, BookingsImportDialog } from "components";
import { lighten } from "@material-ui/core/styles/colorManipulator";
import { useTranslation } from "react-i18next";
import Tooltip from "@material-ui/core/Tooltip";
import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from "@material-ui/icons/Delete";
import FilterListIcon from "@material-ui/icons/FilterList";
import Typography from "@material-ui/core/Typography";

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
  importButton: {
    marginRight: theme.spacing(1)
  },
  exportButton: {
    marginRight: theme.spacing(1)
  },
  searchInput: {
    marginRight: theme.spacing(1)
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

const BookingsToolbar = props => {
  const { className, numSelected, onCreateBooking, ...rest } = props;

  const classes = useStyles();
  const [openImport, setOpenImport] = React.useState(false);
  const { t } = useTranslation();

  const handleClickOpen = () => {
    setOpenImport(true);
  };

  const handleCloseImport = (value) => {
    setOpenImport(false);
  };

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
            {t("Bookings")}
          </Typography>
        )}
      </div>
      <div >
        <SearchInput
          className={classes.searchInput}
          placeholder={t("Search booking")}
        />
      </div>
      <span className={classes.spacer}/>
      <div className={classes.actions}>
        <Button
          className={classes.importButton}
          onClick={handleClickOpen}
          disabled
        >
          Import</Button>
        <Button className={classes.exportButton} disabled>Export</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={onCreateBooking}
        >
          {t("Add booking")}
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
      <BookingsImportDialog url="something" open={openImport} onClose={handleCloseImport} />
    </Toolbar>
  );
};

BookingsToolbar.propTypes = {
  className: PropTypes.string,
  numSelected: PropTypes.number,
  onCreateBooking: PropTypes.func
};

export default BookingsToolbar;
