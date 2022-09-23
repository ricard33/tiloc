import React, { useState } from "react";
import { BookingsTable, BookingsToolbar } from "./components";
import { makeStyles } from "@mui/styles";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
// import { useTranslation } from "react-i18next";
import { useListBookingsPaginatedQuery } from "../../services/api";
import { Card, CardActions, TablePagination } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import PerfectScrollbar from "react-perfect-scrollbar";
import { formatISO } from "../../common/tzUtils";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import { useNavigate } from "react-router-dom";
import { endOfMonth, startOfMonth } from "date-fns";
import { useSelector } from "react-redux";

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
  const [search, setSearch] = useState("");
  const today = new Date();
  const [dateRange, setDateRange] = useState({startDate: startOfMonth(today), endDate: endOfMonth(today)});
  const dateFilter = formatISO(dateRange.startDate) + ":" + formatISO(dateRange.endDate)
  const { data: bookings, isLoading: isLoadingBookings } = useListBookingsPaginatedQuery({
    page_size: rowsPerPage,
    page: page+1,
    ordering: (ordering.order === "desc" ? "-" : "") + ordering.orderBy,
    guest_name__icontains: search,
    for_dates: dateFilter
  });
  const user = useSelector(store => store.auth.user);
  const canAdd = user.permissions.includes("core.add_booking");
  const showPayments = user.permissions.includes("core.view_payment");
  const navigate = useNavigate();


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

  const onEditContract = (booking) => {
    setEditBooking(null);
    navigate("/bookings/" + booking.id + "/contract");
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

  const onSearch = (value) => {
    setSearch(value);
  };

  const onDateRangeChange = (range) => {
    setDateRange(range);
  };

  return (
    <div className={classes.root}>
      <BookingsToolbar
        numSelected={numSelected} onCreateBooking={canAdd ? onCreateBooking : undefined} onSearch={onSearch}
        dateRange={dateRange} onDateRangeChange={onDateRangeChange}
      />
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
          <CardActions>
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
      <BookingDialogLoader
        booking={editBooking}
        onClose={handleCloseEdit}
        onOpenContract={onEditContract}
      />}
    </div>
  );
};

export default BookingList;
