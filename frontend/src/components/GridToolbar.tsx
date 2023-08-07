import React from "react";
import classNames from "classnames";
import { makeStyles } from "@mui/styles";
import { Button, IconButton, Theme, Tooltip, Typography } from "@mui/material";
import { lighten } from "@mui/material/styles";
import { useTranslation } from "react-i18next";
import DeleteIcon from "@mui/icons-material/Delete";
import DateRangeSelector, { DateRange } from "./DateRangeSelector";
import SearchInput from "./SearchInput";
import {
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter
} from "@mui/x-data-grid";
import { GridToolbarQuickFilterProps } from "@mui/x-data-grid/components/toolbar/GridToolbarQuickFilter";

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

type Props = {
  title?: string;
  dateRange?: DateRange;
  numSelected?: number;
  onDateRangeChange?: (range: DateRange) => void;
  onSearch?: (text: string) => void;
  onSearchLabel?: string;
  onDeleteSelected?: () => void;
  showColumnsButton: boolean;
  showDensitySelector?: boolean;
  showExportButton?: boolean;
  showFilterButton?: boolean;
  showQuickFilter?: boolean;
  quickFilterProps?: GridToolbarQuickFilterProps;
  tools?: { label: string; onClick: () => void; icon?: React.ReactNode; disabled: boolean }[];
};

const GridToolbar: React.FunctionComponent<Props> = (props) => {
  const {
    showColumnsButton,
    showDensitySelector,
    showExportButton,
    showFilterButton,
    title,
    numSelected,
    onSearch,
    onSearchLabel,
    onDeleteSelected,
    dateRange,
    onDateRangeChange,
    showQuickFilter,
    quickFilterProps,
    tools
  } = props;

  const classes = useStyles();
  const { t } = useTranslation();
  const variant = "outlined";

  return (
    <GridToolbarContainer
      className={classNames(classes.root, {
        [classes.highlight]: numSelected && numSelected > 0
      })}
    >
      {showColumnsButton && <GridToolbarColumnsButton />}
      {showDensitySelector && <GridToolbarDensitySelector />}
      {showExportButton && <GridToolbarExport />}
      {showFilterButton && <GridToolbarFilterButton />}
      {showQuickFilter && <GridToolbarQuickFilter {...quickFilterProps} />}
      <div className={classes.title}>
        {numSelected && numSelected > 0 ? (
          <Typography color="inherit" variant="subtitle1">
            {t("{{count}} selected", { count: numSelected })}
          </Typography>
        ) : (
          (title && (
            <Typography variant="h4" id="tableTitle">
              {title}
            </Typography>
          )) || <></>
        )}
      </div>
      {onSearch && (
        <div>
          <SearchInput
            className={classes.searchInput}
            placeholder={onSearchLabel}
            onChange={(value) => onSearch(value)}
          />
        </div>
      )}
      {onDateRangeChange && (
        <div>
          <DateRangeSelector
            startDate={dateRange ? dateRange.startDate : undefined}
            endDate={dateRange ? dateRange.endDate : undefined}
            onChange={onDateRangeChange}
          />
        </div>
      )}
      <span className={classes.spacer} />
      <div className={classes.actions}>
        {tools &&
          tools.map((tool) => (
            <Button
              key={tool.label}
              className={classes.importButton}
              onClick={tool.onClick}
              disabled={tool.disabled}
              startIcon={tool.icon}
              variant={variant}
            >
              {tool.label}
            </Button>
          ))}
        {numSelected && numSelected > 0 && onDeleteSelected ? (
          <Tooltip title="Delete">
            <IconButton aria-label="Delete" size="large" onClick={onDeleteSelected}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        ) : (
          ""
          // <Tooltip title="Filter list">
          //   <IconButton aria-label="Filter list" size="large">
          //     <FilterListIcon />
          //   </IconButton>
          // </Tooltip>
        )}
      </div>
    </GridToolbarContainer>
  );
};

export default GridToolbar;
