import React, { useState } from "react";
import { useListBookingsPaginatedQuery, useListBookingStatusesQuery, useListLodgingsQuery } from "../../services/api";
import { Card, CardContent, LinearProgress } from "@mui/material";
import { formatISO } from "../../common/tzUtils";
import BookingDialogLoader from "../../components/BookingDialog/BookingDialogLoader";
import { Route, Routes, useNavigate } from "react-router-dom";
import { endOfMonth, startOfMonth } from "date-fns";
import { useSelector } from "react-redux";
import Page from "../../layouts/Main/Page";
import { useTranslation } from "react-i18next";
import { BookingsImportDialog } from "../../components";
import {
  DataGrid,
  GridColDef,
  GridFilterModel,
  GridRowSelectionModel,
  GridSortModel,
  GridValueFormatterParams
} from "@mui/x-data-grid";
import { Booking, User } from "../../types";
import { formatPrice } from "../../common/priceUtils";
import { RootState } from "../../store";
import { DateRange } from "../../components/DateRangeSelector";
import { GridSortItem } from "@mui/x-data-grid/models/gridSortModel";
import { formatDate } from "../../common/dateUtils";
import GridToolbar from "../../components/GridToolbar";

const BookingList = () => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<number[]>([]);
  const numSelected = selected.length;
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 20,
    page: 0
  });
  const [ordering, setOrdering] = useState<GridSortItem | undefined>({ field: "begin_date", sort: "asc" });
  const [search, setSearch] = useState("");
  const [filterQuery, setFilterQuery] = useState({});
  const [openImport, setOpenImport] = useState<boolean>(false);
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: startOfMonth(today), endDate: endOfMonth(today) });
  const dateFilter = formatISO(dateRange.startDate) + ":" + formatISO(dateRange.endDate);
  const { data: bookings, isFetching } = useListBookingsPaginatedQuery({
    page_size: paginationModel.pageSize,
    page: paginationModel.page + 1,
    ...(ordering ? { ordering: (ordering.sort === "desc" ? "-" : "") + ordering.field } : {}),
    guest_name__icontains: search,
    for_dates: dateFilter,
    ...filterQuery
  });
  const user = useSelector<RootState>((store) => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_booking");
  const navigate = useNavigate();
  const showPayments = user.permissions.includes("core.view_payment");
  const [rowCountState, setRowCountState] = React.useState(bookings?.count ?? 0);
  const { data: lodgings } = useListLodgingsQuery();
  const { data: statuses } = useListBookingStatusesQuery();

  React.useEffect(() => {
    setRowCountState((prevRowCountState) => (bookings?.count !== undefined ? bookings?.count : prevRowCountState));
  }, [bookings?.count, setRowCountState]);

  const dateFormatter = (params: GridValueFormatterParams<Date>) => formatDate(params.value, "dd/MM/yyyy");

  const columns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "begin_date", headerName: t("From"), width: 130, valueFormatter: dateFormatter, filterable: false },
    { field: "end_date", headerName: t("To"), width: 130, valueFormatter: dateFormatter, filterable: false },
    { field: "guest_name", headerName: t("Guest"), minWidth: 130, flex: 1, filterable: false },
    {
      field: "lodging",
      type: "singleSelect",
      headerName: t("Lodging"),
      minWidth: 130,
      flex: 1,
      valueFormatter: (params) => params.value.name,
      valueOptions: lodgings && [...lodgings.map((l) => {
        return { value: l.id, label: l.name };
      })]

    },
    {
      field: "status", headerName: t("Status"), width: 170,
      type: "singleSelect",
      valueFormatter: (params) => params.value.name,
      valueOptions: statuses && [...statuses.map((s) => {
        return { value: s.id, label: s.name };
      })]
    },
    ...(showPayments
      ? [{ field: "price", headerName: t("Price"), type: "number", width: 90, valueFormatter: formatPrice, filterable: false }]
      : [])
  ];

  const onSelectionChange = (newSelection: GridRowSelectionModel) => {
    setSelected(newSelection as number[]);
  };

  const onCreateBooking = () => {
    navigate(`new?begin_date=${formatISO(new Date())}`);
  };

  const onEditBooking = (booking: Booking) => {
    console.log(booking);
    navigate(`${booking.id}`);
  };

  const handleCloseEdit = () => {
    navigate(-1);
  };

  const onEditContract = (booking: Booking) => {
    navigate("/bookings/" + booking.id + "/contract");
  };

  const onChangeOrdering = (items: GridSortModel) => {
    if (items.length > 0) {
      const item = items[0];

      if (item.sort === "asc" || item.sort === "desc") setOrdering(item);
      return;
    }
    setOrdering(undefined);
  };

  const onSearch = (value: string) => {
    setSearch(value);
  };

  const onDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  const handleCloseImport = () => {
    setOpenImport(false);
  };

  const onFilterChange = React.useCallback((filterModel: GridFilterModel) => {
    // console.log(filterModel)
    setFilterQuery(filterModel.items.reduce<{ [key: string]: number | string }>((qs, i) => {
      // if(i.field === 'lodging')
      //   return {...qs, lodging: i.value}
      qs[i.field] = i.value;
      return qs;
    }, {}));
  }, []);

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Routes>
        <Route
          path=":bookingId"
          element={<BookingDialogLoader onClose={handleCloseEdit} onOpenContract={onEditContract} />}
        />
      </Routes>
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              flex: "1 1 auto",
              minHeight: "300px"
            }}
            initialState={{
              sorting: {
                sortModel: [ordering as GridSortItem]
              },
              pagination: { paginationModel: { page: 1, pageSize: 10 } }
            }}
            rows={bookings?.results || []}
            rowCount={rowCountState}
            columns={columns}
            pagination
            paginationMode="server"
            autoPageSize
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortingMode="server"
            onSortModelChange={onChangeOrdering}
            // disableColumnFilter
            filterMode="server"
            onFilterModelChange={onFilterChange}

            loading={isFetching}
            checkboxSelection
            disableRowSelectionOnClick
            onRowClick={(params) => onEditBooking(params.row)}
            onRowSelectionModelChange={onSelectionChange}
            slots={{
              toolbar: GridToolbar,
              loadingOverlay: LinearProgress
            }}
            slotProps={{
              toolbar: {
                showColumnsButton: true,
                showFilterButton: true,
                numSelected: numSelected,
                dateRange: dateRange,
                onDateRangeChange: onDateRangeChange,
                onSearch: onSearch,
                onSearchLabel: t("Search booking"),
                tools: [
                  // { label: t("Import"), onClick: handleClickOpen, disabled: !canAdd },
                  // { label: t("Export"), onClick: () => undefined, disabled: true },
                  { label: t("Add booking"), onClick: onCreateBooking, disabled: !canAdd }
                ]
              }
            }}
          />

        </CardContent>
      </Card>
      <BookingsImportDialog url="something" open={openImport} onClose={handleCloseImport} />
    </Page>
  );
};

export default BookingList;
