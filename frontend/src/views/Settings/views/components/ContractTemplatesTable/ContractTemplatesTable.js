import React, { useState } from "react";
import clsx from "clsx";
import PropTypes from "prop-types";
import PerfectScrollbar from "react-perfect-scrollbar";
import { makeStyles } from "@mui/styles";
import {
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  TablePagination,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import { EnhancedTableHead } from "../../../../../components";
import { parseISO } from 'date-fns';
import { formatDate, formatDistanceToNow } from "../../../../../common/dateUtils";

const useStyles = makeStyles(theme => ({
  root: {},
  content: {
    padding: 0
  },
  inner: {
    minWidth: 1050
  },
  nameContainer: {
    display: "flex",
    alignItems: "center"
  },
  avatar: {
    marginRight: theme.spacing(2)
  },
  actions: {
    justifyContent: "flex-end"
  }
}));

const ContractTemplatesTable = props => {
  const { className, templates, onEdit, onSelectionChange, ...rest } = props;

  const { t } = useTranslation();
  const classes = useStyles();
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [ordering, setOrdering] = useState({ orderBy: "name", order: "asc" });

  const handleSelectAll = event => {
    const { templates } = props;

    let selectedTemplates;

    if (event.target.checked) {
      selectedTemplates = templates.map(template => template.id);
    } else {
      selectedTemplates = [];
    }

    setSelectedTemplates(selectedTemplates);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selectedTemplates.indexOf(id);
    let newSelectedTemplates = [];

    if (selectedIndex === -1) {
      newSelectedTemplates = newSelectedTemplates.concat(selectedTemplates, id);
    } else if (selectedIndex === 0) {
      newSelectedTemplates = newSelectedTemplates.concat(selectedTemplates.slice(1));
    } else if (selectedIndex === selectedTemplates.length - 1) {
      newSelectedTemplates = newSelectedTemplates.concat(selectedTemplates.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedTemplates = newSelectedTemplates.concat(
        selectedTemplates.slice(0, selectedIndex),
        selectedTemplates.slice(selectedIndex + 1)
      );
    }

    setSelectedTemplates(newSelectedTemplates);
    onSelectionChange(newSelectedTemplates);
  };

  const handlePageChange = (event, page) => {
    setPage(page);
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(event.target.value);
  };

  function handleRowClick(event, template) {
    onEdit && onEdit(template);
  }

  const isSelected = id => selectedTemplates.indexOf(id) !== -1;
  const handleRequestSort = (event, property) => {
    const orderBy = property;
    let order = "desc";

    if (ordering.orderBy === property && ordering.order === "desc") {
      order = "asc";
    }

    setOrdering({ order, orderBy });
  };

  function desc(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = cmp(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
  }

  function getSorting(order, orderBy) {
    return order === "desc"
      ? (a, b) => desc(a, b, orderBy)
      : (a, b) => -desc(a, b, orderBy);
  }

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardContent className={classes.content}>
        <PerfectScrollbar>
          <div className={classes.inner}>
            <Table>
              <EnhancedTableHead
                columns={[
                  { id: "name", numeric: false, disablePadding: false, label: t("Name") },
                  { id: "created", numeric: false, disablePadding: false, label: t("Created") },
                  { id: "modified", numeric: false, disablePadding: false, label: t("Modified") },
                  { id: "action", numeric: false, disablePadding: false, label: t("Actions") }
                ]}
                numSelected={selectedTemplates.length}
                order={ordering.order}
                orderBy={ordering.orderBy}
                onSelectAllClick={handleSelectAll}
                onRequestSort={handleRequestSort}
                rowCount={templates.length}
              />
              <TableBody>
                {stableSort(templates, getSorting(ordering.order, ordering.orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(template => (
                    <TableRow
                      className={classes.tableRow}
                      hover
                      key={template.id}
                      selected={isSelected(template.id)}
                      role="checkbox"
                      aria-checked={isSelected(template.id)}
                      tabIndex={-1}
                      onClick={event => handleRowClick(event, template)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedTemplates.indexOf(template.id) !== -1}
                          color="primary"
                          onClick={event => handleSelectOne(event, template.id)}
                          value="true"
                        />
                      </TableCell>
                      <TableCell>
                        <div className={classes.nameContainer}>
                          <Typography variant="body1">{template.name}</Typography>
                        </div>
                      </TableCell>
                      <TableCell title={formatDate(parseISO(template.created))}>
                        {formatDistanceToNow(parseISO(template.created))}
                      </TableCell>
                      <TableCell title={formatDate(parseISO(template.modified))}>
                        {formatDistanceToNow(parseISO(template.modified))}
                      </TableCell>
                      <TableCell>
                        {onEdit && (<Button onClick={event => handleRowClick(event, template)}>
                          <EditIcon/>
                        </Button>)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </PerfectScrollbar>
      </CardContent>
      <CardActions className={classes.actions}>
        <TablePagination
          component="div"
          count={templates.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardActions>
    </Card>
  );
};

ContractTemplatesTable.propTypes = {
  className: PropTypes.string,
  onEdit: PropTypes.func,
  onSelectionChange: PropTypes.func,
  templates: PropTypes.array.isRequired,
};

export default ContractTemplatesTable;
