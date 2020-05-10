import React from "react";
import PropTypes from "prop-types";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import { useTranslation } from "react-i18next";

const EnhancedTableHead = props => {
  const {
    columns,
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
    onRequestSort
  } = props;
  const { t } = useTranslation();

  const createSortHandler = property => event => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>
        {columns.map(
          col => (
            <TableCell
              key={col.id}
              align={col.numeric ? "right" : "left"}
              padding={col.disablePadding ? "none" : "default"}
              sortDirection={orderBy === col.id ? order : false}
            >
              <Tooltip
                title={t("Sort")}
                placement={col.numeric ? "bottom-end" : "bottom-start"}
                enterDelay={300}
              >
                <TableSortLabel
                  active={orderBy === col.id}
                  direction={order}
                  onClick={createSortHandler(col.id)}
                >
                  {col.label}
                </TableSortLabel>
              </Tooltip>
            </TableCell>
          ),
          this
        )}
      </TableRow>
    </TableHead>
  );
};

EnhancedTableHead.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.exact({
    id: PropTypes.string,
    numeric: PropTypes.bool,
    disablePadding: PropTypes.bool,
    label: PropTypes.string
  })).isRequired,
  numSelected: PropTypes.number.isRequired,
  onRequestSort: PropTypes.func,
  onSelectAllClick: PropTypes.func,
  order: PropTypes.oneOf(["asc", "desc"]),
  orderBy: PropTypes.any,
  rowCount: PropTypes.number
};

export default EnhancedTableHead;
