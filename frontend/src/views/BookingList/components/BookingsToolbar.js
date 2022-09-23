import React, { useState } from "react";
import classNames from "classnames";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";
import { Button, Toolbar } from "@mui/material";
import { SearchInput, BookingsImportDialog } from "../../../components";
import { lighten } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import Typography from "@mui/material/Typography";
import DateRangeSelector from "../../../components/DateRangeSelector";

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
    theme.palette.mode === "light"
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
  const { className, numSelected, onCreateBooking, onSearch, dateRange, onDateRangeChange, ...rest } = props;

  const classes = useStyles();
  const [openImport, setOpenImport] = useState(false);
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
            {t("{{count}} selected", { count: numSelected })}
          </Typography>
        ) : (
          <Typography variant="h3" id="tableTitle">
            {t("Bookings")}
          </Typography>
        )}
      </div>
      <div>
        <SearchInput
          className={classes.searchInput}
          placeholder={t("Search booking")}
          onChange={event => onSearch(event.target.value)}
        />
      </div>
      <div>
        <DateRangeSelector startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={onDateRangeChange} />
      </div>
      <span className={classes.spacer} />
      <div className={classes.actions}>
        <Button
          className={classes.importButton}
          onClick={handleClickOpen}
          disabled
        >
          Import</Button>
        <Button className={classes.exportButton} disabled>Export</Button>
        <Button
          // color="primary"
          // variant="contained"
          disabled={!onCreateBooking}
          onClick={onCreateBooking}
        >
          {t("Add booking")}
        </Button>
        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton aria-label="Delete" size="large">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton aria-label="Filter list" size="large">
              <FilterListIcon />
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
  dateRange: PropTypes.shape({
    startDate: PropTypes.instanceOf(Date),
    endDate: PropTypes.instanceOf(Date),
  }),
  numSelected: PropTypes.number,
  onCreateBooking: PropTypes.func,
  onDateRangeChange: PropTypes.func,
  onSearch: PropTypes.func
}
;

export default BookingsToolbar;
