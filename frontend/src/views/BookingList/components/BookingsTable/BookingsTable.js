import React, { useState } from "react";
import PropTypes from "prop-types";
import { makeStyles } from "@mui/styles";
import {
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";
import { EnhancedTableHead } from "../../../../components";
import Button from "@mui/material/Button";
import { formatDate } from "../../../../common/dateUtils";
import { parseISO } from "date-fns";

const useStyles = makeStyles(theme => ({
  root: {},
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
  const { bookings, onEdit, onSelectionChange, ordering, onChangeOrdering } = props;

  const { t } = useTranslation();
  const classes = useStyles();
  const [selectedBookings, setSelectedUsers] = useState([]);

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

  function handleRowClick(event, booking) {
    // history.push("/bookings/" + id);
    onEdit && onEdit(booking);
  }

  const isSelected = id => selectedBookings.indexOf(id) !== -1;
  const handleRequestSort = (event, property) => {
    onChangeOrdering && onChangeOrdering(property);
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
          // .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
          .map(booking => (
            <TableRow
              className={classes.tableRow}
              hover
              key={booking.id}
              selected={isSelected(booking.id)}
              role="checkbox"
              aria-checked={isSelected(booking.id)}
              tabIndex={-1}
              onClick={event => handleRowClick(event, booking)}
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
                {formatDate(parseISO(booking.begin_date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                {formatDate(parseISO(booking.end_date), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>
                <div className={classes.nameContainer}>
                  <Typography variant="body1">{booking.guest_name}</Typography>
                </div>
              </TableCell>
              <TableCell>
                {booking.lodging ? booking.lodging.name : ""}
              </TableCell>
              <TableCell>{booking.status.name}</TableCell>
              <TableCell>{booking.price}</TableCell>
              <TableCell>
                {onEdit && (<Button onClick={event => handleRowClick(event, booking)}>
                  <EditIcon />
                </Button>)}
              </TableCell>
            </TableRow>
          ))}
      </TableBody>
    </Table>
  );
};

BookingsTable.propTypes = {
  bookings: PropTypes.array.isRequired,
  className: PropTypes.string,
  onChangeOrdering: PropTypes.func,
  onEdit: PropTypes.func,
  onSelectionChange: PropTypes.func,
  ordering: PropTypes.shape({
    order: PropTypes.string,
    orderBy: PropTypes.string,
  }),
};

export default BookingsTable;
