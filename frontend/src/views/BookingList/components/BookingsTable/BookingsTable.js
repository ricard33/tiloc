import React, { useState } from 'react';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import moment from 'moment';
import PerfectScrollbar from 'react-perfect-scrollbar';
import { makeStyles } from '@material-ui/styles';
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
} from '@material-ui/core';
import EditIcon from '@material-ui/icons/Edit';
import { Link } from "react-router-dom";

const useStyles = makeStyles(theme => ({
  root: {},
  content: {
    padding: 0
  },
  inner: {
    minWidth: 1050
  },
  nameContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  avatar: {
    marginRight: theme.spacing(2)
  },
  actions: {
    justifyContent: 'flex-end'
  }
}));

const BookingsTable = props => {
  const { className, bookings, ...rest } = props;

  const classes = useStyles();

  const [selectedBookings, setSelectedUsers] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);

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
  };

  const handlePageChange = (event, page) => {
    setPage(page);
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(event.target.value);
  };

  return (
    <Card
      {...rest}
      className={clsx(classes.root, className)}
    >
      <CardContent className={classes.content}>
        <PerfectScrollbar>
          <div className={classes.inner}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedBookings.length === bookings.length}
                      color="primary"
                      indeterminate={
                        selectedBookings.length > 0 &&
                        selectedBookings.length < bookings.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Lodging</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.slice(0, rowsPerPage).map(booking => (
                  <TableRow
                    className={classes.tableRow}
                    hover
                    key={booking.id}
                    selected={selectedBookings.indexOf(booking.id) !== -1}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedBookings.indexOf(booking.id) !== -1}
                        color="primary"
                        onChange={event => handleSelectOne(event, booking.id)}
                        value="true"
                      />
                    </TableCell>
                    <TableCell>
                      {moment(booking.begin_date).format('DD/MM/YYYY')}
                    </TableCell>
                    <TableCell>
                      {moment(booking.end_date).format('DD/MM/YYYY')}
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
};

export default BookingsTable;
