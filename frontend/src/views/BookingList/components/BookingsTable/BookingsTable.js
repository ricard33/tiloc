import React, { useState } from "react";
import clsx from "clsx";
import PropTypes from "prop-types";
import moment from "moment";
import PerfectScrollbar from "react-perfect-scrollbar";
import { makeStyles } from "@material-ui/styles";
import {
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  TablePagination
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import { useHistory, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import EnhancedTableHead from "components/EnhancedTableHead";

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

const BookingsTable = props => {
  const { className, bookings, onSelectionChange, ...rest } = props;

  const { t } = useTranslation();
  const classes = useStyles();
  const history = useHistory();
  const [selectedBookings, setSelectedUsers] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [ordering, setOrdering] = useState({ orderBy: "begin_date", order: "asc" });

  const handleSelectAll = event => {
    const { bookings } = props;

    let selectedUsers;

    if (event.target.checked) {
      selectedUsers = bookings.map(user => user.id);
    } else {
      selectedUsers = [];
    }

    setSelectedUsers(selectedUsers);
  };

  const handleSelectOne = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selectedBookings.indexOf(id);
    let newSelectedUsers = [];

    if (selectedIndex === -1) {
      newSelectedUsers = newSelectedUsers.concat(selectedBookings, id);
    } else if (selectedIndex === 0) {
      newSelectedUsers = newSelectedUsers.concat(selectedBookings.slice(1));
    } else if (selectedIndex === selectedBookings.length - 1) {
      newSelectedUsers = newSelectedUsers.concat(selectedBookings.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelectedUsers = newSelectedUsers.concat(
        selectedBookings.slice(0, selectedIndex),
        selectedBookings.slice(selectedIndex + 1)
      );
    }

    setSelectedUsers(newSelectedUsers);
    onSelectionChange(newSelectedUsers);
  };

  const handlePageChange = (event, page) => {
    setPage(page);
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(event.target.value);
  };

  function handleRowClick(event, id) {
    history.push("/bookings/" + id);
  }

  const isSelected = id => selectedBookings.indexOf(id) !== -1;
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
                  { id: "begin_date", numeric: false, disablePadding: false, label: t("From") },
                  { id: "end_date", numeric: false, disablePadding: false, label: t("To") },
                  { id: "guest_name", numeric: false, disablePadding: false, label: t("Guest") },
                  { id: "lodging", numeric: false, disablePadding: false, label: t("Lodging") },
                  { id: "status", numeric: false, disablePadding: false, label: t("Status") },
                  { id: "price", numeric: false, disablePadding: false, label: t("Price") },
                  { id: "action", numeric: false, disablePadding: false, label: t("Actions") }
                ]}
                numSelected={selectedBookings.length}
                order={ordering.order}
                orderBy={ordering.orderBy}
                onSelectAllClick={handleSelectAll}
                onRequestSort={handleRequestSort}
                rowCount={bookings.length}
              />
              <TableBody>
                {stableSort(bookings, getSorting(ordering.order, ordering.orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map(booking => (
                    <TableRow
                      className={classes.tableRow}
                      hover
                      key={booking.id}
                      selected={isSelected(booking.id)}
                      role="checkbox"
                      aria-checked={isSelected(booking.id)}
                      tabIndex={-1}
                      onClick={event => handleRowClick(event, booking.id)}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedBookings.indexOf(booking.id) !== -1}
                          color="primary"
                          onClick={event => handleSelectOne(event, booking.id)}
                          value="true"
                        />
                      </TableCell>
                      <TableCell>
                        {moment(booking.begin_date).format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell>
                        {moment(booking.end_date).format("DD/MM/YYYY")}
                      </TableCell>
                      <TableCell>
                        <div className={classes.nameContainer}>
                          <Typography variant="body1">{booking.guest_name}</Typography>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.lodging.name}
                      </TableCell>
                      <TableCell>{booking.status.name}</TableCell>
                      <TableCell>{booking.price}</TableCell>
                      <TableCell>
                        <Link to={"/bookings/" + booking.id}>
                          <EditIcon/>
                        </Link>
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
          count={bookings.length}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handleRowsPerPageChange}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </CardActions>
    </Card>
  );
};

BookingsTable.propTypes = {
  bookings: PropTypes.array.isRequired,
  className: PropTypes.string,
  onSelectionChange: PropTypes.func
};

export default BookingsTable;
