import React from "react";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";
import { Button, Theme, Toolbar } from "@mui/material";
import { lighten } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";
import Typography from "@mui/material/Typography";
import DateRangeSelector from "./DateRangeSelector";
import SearchInput from "./SearchInput";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    paddingRight: theme.spacing(1),
    paddingLeft: 0
  },
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

type ListToolbarProps = {
  title: string,
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  numSelected?: number;
  onDateRangeChange?: (range: { startDate: Date; endDate: Date; }) => void;
  onSearch?: (text: string) => void;
  onSearchLabel?: string;
  onDeleteSelected?: () => void;
  tools?: [{ label: string; onClick: () => void; icon?: React.ReactNode, disabled: boolean }]
};

const ListToolbar: React.FunctionComponent<ListToolbarProps> = (props) => {
  const { title, numSelected, onSearch, onSearchLabel, onDeleteSelected, dateRange, onDateRangeChange, tools } = props;

  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <Toolbar
      className={classNames(classes.root, {
        [classes.highlight]: numSelected && numSelected > 0
      })}
    >
      <div className={classes.title}>
        {numSelected && numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1">
            {t("{{count}} selected", { count: numSelected })}
          </Typography>
        ) : (
          <Typography variant="h4" id="tableTitle">
            {title}
          </Typography>
        )}
      </div>
      {onSearch && <div>
        <SearchInput
          className={classes.searchInput}
          placeholder={onSearchLabel}
          onChange={event => onSearch(event.target.value)}
        />
      </div>}
      {dateRange && onDateRangeChange && <div>
        <DateRangeSelector startDate={dateRange.startDate} endDate={dateRange.endDate} onChange={onDateRangeChange} />
      </div>}
      <span className={classes.spacer} />
      <div className={classes.actions}>
        {tools && tools.map((tool, index) => (
          <Button
            key={tool.label}
            className={classes.importButton}
            onClick={tool.onClick}
            disabled={tool.disabled}
          >
            {tool.icon && (
              <IconButton aria-label={tool.label} size="large">
                {tool.icon}
              </IconButton>
            )}
            {tool.label}
          </Button>
        ))}
        {numSelected && numSelected > 0 ? (
          <Button onClick={onDeleteSelected} disabled={!onDeleteSelected}>
            <Tooltip title="Delete">
              <IconButton aria-label="Delete" size="large">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Button>
        ) : (
          <Tooltip title="Filter list">
            <IconButton aria-label="Filter list" size="large">
              <FilterListIcon />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </Toolbar>
  );
};

export default ListToolbar;
