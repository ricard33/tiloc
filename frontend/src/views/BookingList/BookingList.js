import React, { useEffect, useState } from "react";
import { BookingsTable, BookingsToolbar } from "./components";
import { makeStyles } from "@material-ui/styles";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";
// import { useTranslation } from "react-i18next";
import { BookingDialog } from "../../components";
import { useListBookingsPaginatedQuery } from "../../services/api";
import { Card, CardActions, TablePagination } from "@material-ui/core";
import CardContent from "@material-ui/core/CardContent";
import PerfectScrollbar from "react-perfect-scrollbar";
import { formatISO } from "../../common/tzUtils";

const useStyles = makeStyles(theme => ({
  root: {
    padding: theme.spacing(3)
  },
  content: {
    marginTop: theme.spacing(2)
  },
  cardContent: {
    padding: 0
  },
  inner: {
    minWidth: 1050
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff"
  }
}));

const BookingList = () => {
  const classes = useStyles();
  // const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const [editBooking, setEditBooking] = useState(null);
  const numSelected = selected.length;
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [ordering, setOrdering] = useState({ orderBy: "begin_date", order: "asc" });
  const { data: bookings, isLoading: isLoadingBookings, isFetching: isFetchingBookings, refetch } = useListBookingsPaginatedQuery({
    page_size: rowsPerPage,
    page: page+1,
    ordering: (ordering.order === "desc" ? "-" : "") + ordering.orderBy
  });


  const onSelectionChange = (newSelection) => {
    setSelected(newSelection);
  };

  const onCreateBooking = () => {
    setEditBooking({
      lodging_id: undefined,
      begin_date: formatISO(new Date())
    });
  };

  const onEditBooking = (booking) => {
    console.log(booking);
    setEditBooking(booking);
  };

  const handleCloseEdit = () => {
    setEditBooking(null);
  };
  const handlePageChange = (event, page) => {
    setPage(page);
  };

  const handleRowsPerPageChange = event => {
    setRowsPerPage(event.target.value);
  };

  const onChangeOrdering = (property) => {
    const orderBy = property;
    let order = "desc";

    if (ordering.orderBy === property && ordering.order === "desc") {
      order = "asc";
    }

    setOrdering({ order, orderBy });
  };

  return (
    <div className={classes.root}>
      <BookingsToolbar numSelected={numSelected} onCreateBooking={onCreateBooking}/>
      <div className={classes.content}>
        <Card>
          <CardContent className={classes.cardContent}>
            <PerfectScrollbar>
              <div className={classes.inner}>
                <BookingsTable
                  bookings={bookings?.results || []}
                  onEdit={onEditBooking}
                  onSelectionChange={onSelectionChange}
                  ordering={ordering}
                  onChangeOrdering={onChangeOrdering}
                />
                <Backdrop className={classes.backdrop} open={isLoadingBookings} timeout={0}>
                  <CircularProgress color="inherit"/>
                </Backdrop>
              </div>
            </PerfectScrollbar>
          </CardContent>
          <CardActions className={classes.actions}>
            <TablePagination
              component="div"
              count={bookings ? bookings.count : 0}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
              page={page}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </CardActions>
        </Card>
      </div>
      {editBooking &&
      <BookingDialog
        booking={editBooking}
        onClose={handleCloseEdit}
      />}
    </div>
  );
};

export default BookingList;
