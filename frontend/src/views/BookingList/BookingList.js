import React, { useState } from "react";
import { BookingsTable } from "./components";
import { makeStyles } from "@mui/styles";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
// import { useTranslation } from "react-i18next";
import { useDeleteBookingMutation, useListBookingsPaginatedQuery, useUpdateBookingMutation } from "../../services/api";
import { Card, CardActions, TablePagination } from "@mui/material";
import CardContent from "@mui/material/CardContent";
import PerfectScrollbar from "react-perfect-scrollbar";
import { formatISO } from "../../common/tzUtils";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import { Route, Routes, useNavigate } from "react-router-dom";
import { endOfMonth, startOfMonth } from "date-fns";
import { useSelector } from "react-redux";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { useTranslation } from "react-i18next";
import { BookingsImportDialog } from "../../components";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import { useConfirm } from "../../libs/MuiConfirm";

const useStyles = makeStyles(theme => ({
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
  const { t } = useTranslation();
  const [selected, setSelected] = useState([]);
  const numSelected = selected.length;
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(0);
  const [ordering, setOrdering] = useState({ orderBy: "begin_date", order: "asc" });
  const [search, setSearch] = useState("");
  const [openImport, setOpenImport] = useState(false);
  const today = new Date();
  const [dateRange, setDateRange] = useState({ startDate: startOfMonth(today), endDate: endOfMonth(today) });
  const dateFilter = formatISO(dateRange.startDate) + ":" + formatISO(dateRange.endDate);
  const { data: bookings, isLoading: isLoadingBookings } = useListBookingsPaginatedQuery({
    page_size: rowsPerPage,
    page: page + 1,
    ordering: (ordering.order === "desc" ? "-" : "") + ordering.orderBy,
    guest_name__icontains: search,
    for_dates: dateFilter
  });
  const user = useSelector(store => store.auth.user);
  const canAdd = user.permissions.includes("core.add_booking");
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();
  const confirm = useConfirm();
  const [ updateBooking ] = useUpdateBookingMutation();
  const [ deleteBooking ] = useDeleteBookingMutation();
  const canEdit = user.permissions.includes("core.change_booking");
  const canDelete = user.permissions.includes("core.delete_booking");


  const onSelectionChange = (newSelection) => {
    setSelected(newSelection);
  };

  const onCreateBooking = () => {
    navigate(`new?begin_date=${formatISO(new Date())}`);
  };

  const onEditBooking = (booking) => {
    console.log(booking);
    navigate(`${booking.id}`);
  };

  const handleCloseEdit = () => {
    navigate(-1);
  };

  const onEditContract = (booking) => {
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

  const handleClickOpen = () => {
    setOpenImport(true);
  };

  const handleCloseImport = (value) => {
    setOpenImport(false);
  };

  const onCancelBooking = (booking) => {
    if (!canEdit) return;
    updateBooking({ ...booking, cancelled: true }).then((result) => {
      if (result.error) {
        const error = result.error;
        console.error("Error canceling booking", error);
        showError(t("Impossible to cancel booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking cancelled"));
      }
    });
  };

  const onUncancelBooking = (booking) => {
    if (!canEdit) return;
    updateBooking({ ...booking, cancelled: false }).then((result) => {
      if (result.error) {
        const error = result.error;
        console.error("Error uncancelling booking", error);
        showError(t("Impossible to uncancel booking: ") + fetchErrorDecode(error));
      } else {
        showSuccess(t("Booking uncancelled"));
      }
    });
  };

  const onDeleteBooking = (booking) => {
    if(!canDelete) return;
    confirm({
      title: t("Delete booking: {{ guest_name }} on {{ lodging_name }}", {
        guest_name: booking.guest_name,
        lodging_name: booking.lodging.name
      }),
      description: t("Do you really want to permanently delete this booking?")
    })
      .then(() => {
        setSelected(null);
        deleteBooking(booking.id).then((result) => {
          if (result.error) {
            const error = result.error;
            console.error("Error deleting booking", error);
            showError(t("Impossible to delete the booking: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Booking deleted"));
            handleCloseEdit();
          }
        });
      })
      .catch(() => { /* ... */
      });
  };


  return (
    <Page>
      <Routes>
        <Route
          path=":bookingId"
          element={
            <BookingDialogLoader
              onClose={handleCloseEdit}
              onOpenContract={onEditContract}
              onCancelBooking={onCancelBooking}
              onUncancelBooking={onUncancelBooking}
              onDelete={onDeleteBooking}
            />}
        />
      </Routes>
      <ListToolbar
        title={t("Bookings")}
        numSelected={numSelected} onSearch={onSearch} onSearchLabel={t("Search booking")}
        dateRange={dateRange} onDateRangeChange={onDateRangeChange}
        tools={[
          { label: t("Import"), onClick: handleClickOpen, disabled: !canAdd },
          { label: t("Export"), onClick: ()=>undefined, disabled: true },
          { label: t("Add booking"), onClick: onCreateBooking, disabled: !canAdd },
        ]}
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
                  <CircularProgress color="inherit" />
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
      {/*{editBooking &&*/}
      {/*  <BookingDialogLoader*/}
      {/*    booking={editBooking}*/}
      {/*    onClose={handleCloseEdit}*/}
      {/*    onOpenContract={onEditContract}*/}
      {/*    onCancelBooking={onCancelBooking}*/}
      {/*    onUncancelBooking={onUncancelBooking}*/}
      {/*    onDelete={onDeleteBooking}*/}
      {/*  />}*/}
      <BookingsImportDialog url="something" open={openImport} onClose={handleCloseImport} />
    </Page>
  );
};

export default BookingList;
