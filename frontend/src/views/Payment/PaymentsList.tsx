import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useListPaymentsPaginatedQuery } from "../../services/api";
// import { useNavigate } from "react-router-dom";
import { paymentMethods, Lodging, User, Payment } from "../../types";
import {
  DataGrid, GridColDef,
  GridSortModel,
  GridToolbar,
  GridValueFormatterParams
} from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { formatDate } from "../../common/dateUtils";
import { formatPrice } from "../../common/priceUtils";
import { GridSortItem } from "@mui/x-data-grid/models/gridSortModel";
import { DateRange } from "../../components/DateRangeSelector";
import { formatISO } from "../../common/tzUtils";

type Props = {};

const PaymentsList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const [paginationModel, setPaginationModel] = React.useState({ pageSize: 20, page: 0, });
  const [ordering, setOrdering] = useState<GridSortItem | undefined>({ field: "date", sort: "desc" });
  const [dateRange, setDateRange] = useState<DateRange>();
  const dateFilter = dateRange ? formatISO(dateRange.startDate) + ":" + formatISO(dateRange.endDate) : "";
  const { data } = useListPaymentsPaginatedQuery({
    page_size: paginationModel.pageSize,
    page: paginationModel.page + 1,
    ...(ordering ? { ordering: (ordering.sort === "desc" ? "-" : "") + ordering.field } : {}),
    for_dates: dateFilter

  }, { refetchOnMountOrArgChange: 20 });
  const [rowCountState, setRowCountState] = React.useState(data?.count ?? 0);
  // const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canDoReconciliation = user.permissions.includes("core.do_reconciliation");

  React.useEffect(() => {
    setRowCountState((prevRowCountState) =>
      data?.count !== undefined ? data?.count : prevRowCountState
    );
  }, [data?.count, setRowCountState]);

  const payments = data ? (data.results as never as Payment[]).map((p: Payment) => {
    return {
      ...p,
      lodging: p.booking.lodging,
      guest_name: p.booking.guest_name,
    }
  }) : [];

  const paymentLabels = paymentMethods(t).reduce<Record<string, string>>((obj, cur) => ({
    ...obj,
    [cur[0]]: cur[1]
  }), {});

  const paymentLabelsArray = paymentMethods(t).reduce<{value: string, label: string}[]>((array, cur) => ([
    ...array,
    {value: cur[0], label: cur[1]}
  ]), []);

  console.log(paymentLabelsArray);

  const columns = React.useMemo<GridColDef[]>(
    () => [
      // { field: "id", headerName: "ID", width: 70 },
      {
        field: "date", headerName: t("Date"), width: 200,
        valueFormatter: (params: GridValueFormatterParams<Date>) => formatDate(params.value, "PPP"),
      },
      {
        field: "lodging", headerName: t("Lodging"), width: 200,
        valueFormatter: (params: GridValueFormatterParams<Partial<Lodging>>) => params.value ? params.value.name ?? "" : ""
      },
      { field: "guest_name", headerName: t("Guest"), width: 200, },
      { field: "description", headerName: t("Description"), width: 130 },
      {
        field: "amount", headerName: t("Amount"), type: "number", width: 90,
        valueFormatter: formatPrice
      },
      {
        field: "method", headerName: t("Method"), width: 150,
        valueFormatter: params => paymentLabels[params.value],
        type: "singleSelect",
        valueOptions: paymentLabelsArray,
        editable: true
      }
    ], [paymentLabels, paymentLabelsArray, t]);

  const onDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };

  // const onClick = (payment: Payment) => {
  //   navigate(payment.id!.toString());
  // };

  const onChangeOrdering = (properties: GridSortModel) => {
    if (properties.length > 0) {
      const property = properties[0];

      if (property.sort === "asc" || property.sort === "desc")
        setOrdering(property);
      return;
    }
    setOrdering(undefined);
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar
        title={t("Payments")}
        dateRange={dateRange} onDateRangeChange={onDateRangeChange}
        // tools={[
        //   { label: t("Create"), onClick: onCreatePayment, disabled: !canAdd }
        // ]}
      />
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
              }
            }}
            rows={payments || []}
            rowCount={rowCountState}
            columns={columns}
            pagination
            paginationMode="server"
            autoPageSize
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            sortingMode="server"
            onSortModelChange={onChangeOrdering}
            // pageSize={20}
            // rowsPerPageOptions={[5, 10, 20, 50]}
            // onRowClick={(params) => onClick(params.row)}
            components={{
              Toolbar: GridToolbar
            }}
          />
        </CardContent>
      </Card>
    </Page>
  );
};

export default PaymentsList;
