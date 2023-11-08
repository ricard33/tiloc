import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useDeletePaymentMutation,
  useListLodgingsQuery,
  useListPaymentsPaginatedQuery,
  useUpdatePaymentMutation
} from "../../services/api";
import { Lodging, Payment, paymentMethods, User } from "../../types";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridEventListener,
  GridFilterModel,
  GridRowEditStopReasons,
  GridRowModel,
  GridRowModes,
  GridRowModesModel,
  GridRowParams,
  GridSortModel,
  GridValueFormatterParams
} from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { formatPrice } from "../../common/priceUtils";
import { GridSortItem } from "@mui/x-data-grid/models/gridSortModel";
import { DateRange } from "../../components/DateRangeSelector";
import { formatISO } from "../../common/tzUtils";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { formatDate } from "../../common/dateUtils";
import { useConfirm } from "../../libs/MuiConfirm";
import GridToolbar from "../../components/GridToolbar";
import Paper from "@mui/material/Paper";

type Props = {};

const PaymentsList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const [paginationModel, setPaginationModel] = React.useState({ pageSize: 20, page: 0 });
  const [ordering, setOrdering] = useState<GridSortItem | undefined>({ field: "date", sort: "desc" });
  const [filterQuery, setFilterQuery] = useState({});
  const [dateRange, setDateRange] = useState<DateRange>();
  const dateFilter = dateRange ? formatISO(dateRange.startDate) + ":" + formatISO(dateRange.endDate) : "";
  const { data } = useListPaymentsPaginatedQuery({
    page_size: paginationModel.pageSize,
    page: paginationModel.page + 1,
    ...(ordering ? { ordering: (ordering.sort === "desc" ? "-" : "") + ordering.field } : {}),
    for_dates: dateFilter,
    ...filterQuery
  }, { refetchOnMountOrArgChange: 20 });
  const [updatePayment] = useUpdatePaymentMutation();
  const [deletePayment] = useDeletePaymentMutation();
  const { data: lodgings } = useListLodgingsQuery();
  const [rowCountState, setRowCountState] = React.useState(data?.count ?? 0);
  const confirm = useConfirm();
  const { showError, showSuccess } = useAlert();
  // const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canDoReconciliation = user.permissions.includes("core.reconciliation");
  const [rowModesModel, setRowModesModel] = React.useState<GridRowModesModel>({});

  React.useEffect(() => {
    setRowCountState((prevRowCountState) =>
      data?.count !== undefined ? data?.count : prevRowCountState
    );
  }, [data?.count, setRowCountState]);

  const onValidatePayment = useCallback((payment: Payment) => {
    if (canDoReconciliation) {
      updatePayment({ ...payment, checked: !payment.checked }).then((result) => {
        if ((result as any).error) {
          const error = (result as any).error;
          console.error("Error during payment reconciliation", error);
          showError(t("Impossible to (un)check payment: ") + fetchErrorDecode(error));
        } else {
          payment.checked = !payment.checked;
        }
      });

    }
  }, [canDoReconciliation, showError, t, updatePayment]);

  const payments = data ? (data.results as never as Payment[]).map((p: Payment) => {
    return {
      ...p,
      lodging: p.booking.lodging,
      guest_name: p.booking.guest_name
    };
  }) : [];

  const handleRowEditStop: GridEventListener<"rowEditStop"> = useCallback((params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  }, []);

  const handleEditClick = useCallback((payment: Payment) => () => {
    if (payment.id) {
      setRowModesModel({ ...rowModesModel, [payment.id]: { mode: GridRowModes.Edit } });
    }
  }, [rowModesModel]);

  const handleSaveClick = useCallback((payment: Payment) => () => {
    setRowModesModel({ ...rowModesModel, [payment.id!]: { mode: GridRowModes.View } });
  }, [rowModesModel]);

  const handleDeleteClick = useCallback((payment: Payment) => () => {
    confirm({
      title: t("Delete payment: {{ amount }} € on {{ date }}", {
        amount: payment.amount,
        date: formatDate(payment.date)
      }),
      description: t("Do you really want to permanently delete this payment?")
    })
      .then(() => {
        deletePayment(payment).then((result) => {
          if ((result as any).error) {
            const error = (result as any).error;
            console.error("Error deleting payment", error);
            showError(t("Impossible to delete the payment: ") + fetchErrorDecode(error));
          } else {
            showSuccess(t("Payment deleted"));
          }
        });
      });
  }, [confirm, deletePayment, showError, showSuccess, t]);

  const handleCancelClick = useCallback((payment: Payment) => () => {
    setRowModesModel({
      ...rowModesModel,
      [payment.id!]: { mode: GridRowModes.View, ignoreModifications: true }
    });

    // const editedRow = rows.find((row) => row.id === payment.id);
    // if (editedRow!.isNew) {
    //   setRows(rows.filter((row) => row.id !== id));
    // }
  }, [rowModesModel]);

  const processRowUpdate = useCallback((newRow: GridRowModel) => {
    updatePayment({ ...newRow }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error("Error during payment reconciliation", error);
        showError(t("Impossible to (un)check payment: ") + fetchErrorDecode(error));
      }
    });
    return newRow;
  }, [showError, t, updatePayment]);

  const handleRowModesModelChange = useCallback((newRowModesModel: GridRowModesModel) => {
    setRowModesModel(newRowModesModel);
  }, []);

  const paymentLabels = paymentMethods(t).reduce<Record<string, string>>((obj, cur) => ({
    ...obj,
    [cur[0]]: cur[1]
  }), {});

  const paymentLabelsArray = paymentMethods(t).reduce<{ value: string, label: string }[]>((array, cur) => ([
    ...array,
    { value: cur[0], label: cur[1] }
  ]), []);

  const columns = React.useMemo<GridColDef[]>(
    () => [
      // { field: "id", headerName: "ID", width: 70 },
      {
        field: "checked", headerName: t("Reconciliation"), width: 40, type: "actions",
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={params.row.checked ? <CheckCircleOutlineIcon color="success" /> :
              <CancelOutlinedIcon color="warning" />}
            onClick={() => onValidatePayment(params.row)} label="validated"
          />
        ]
      },
      {
        field: "date", headerName: t("Date"), width: 140, type: "date", editable: true
        // valueFormatter: (params: GridValueFormatterParams<Date>) => formatDate(params.value, "PPP")
      },
      {
        field: "lodging", headerName: t("Lodging"), width: 110, type: "singleSelect",
        valueFormatter: (params: GridValueFormatterParams<Partial<Lodging>>) => params.value ? params.value.name ?? "" : "",
        valueOptions: lodgings && [...lodgings.map((l) => {
          return { value: l.id, label: l.name };
        })]
      },
      { field: "guest_name", headerName: t("Guest"), width: 200 },
      { field: "description", headerName: t("Description"), width: 130, editable: true },
      {
        field: "amount", headerName: t("Amount"), type: "number", width: 90, editable: true,
        valueFormatter: formatPrice
      },
      {
        field: "method", headerName: t("payment method"), width: 150,
        valueFormatter: params => paymentLabels[params.value],
        type: "singleSelect",
        valueOptions: paymentLabelsArray,
        editable: true
      },
      {
        field: "actions",
        type: "actions",
        getActions: (params: GridRowParams) => {
          const isInEditMode = rowModesModel[params.id]?.mode === GridRowModes.Edit;
          if (isInEditMode) {
            return [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                sx={{
                  color: "primary.main"
                }}
                onClick={handleSaveClick(params.row)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                className="textPrimary"
                onClick={handleCancelClick(params.row)}
                color="inherit"
              />
            ];
          }
          return [
            <GridActionsCellItem
              icon={<EditIcon />}
              label="Edit"
              className="textPrimary"
              onClick={handleEditClick(params.row)}
              color="inherit"
            />,
            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={handleDeleteClick(params.row)}
              color="inherit"
            />
          ];
        }
      }
    ],
    [handleCancelClick, handleDeleteClick, handleEditClick, handleSaveClick, lodgings, onValidatePayment, paymentLabels, paymentLabelsArray, rowModesModel, t]);

  const onDateRangeChange = useCallback((range: DateRange) => {
    setDateRange(range);
  }, []);

  // const onClick = (payment: Payment) => {
  //   navigate(payment.id!.toString());
  // };

  const onChangeOrdering = useCallback((items: GridSortModel) => {
    if (items.length > 0) {
      const item = items[0];

      if (item.sort === "asc" || item.sort === "desc")
        setOrdering(item);
      return;
    }
    setOrdering(undefined);
  }, []);

  const onFilterChange = React.useCallback((filterModel: GridFilterModel) => {
    // console.log(filterModel)
    setFilterQuery(filterModel.items.reduce<{
      [key: string]: number | string
    }>((qs, i) => {
      // if(i.field === 'lodging')
      //   return {...qs, lodging: i.value}
      qs[i.field] = i.value;
      return qs;
    }, {}));
  }, []);

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Paper sx={{ padding: 0, height: "100%" }}>
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
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          pagination
          paginationMode="server"
          autoPageSize
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortingMode="server"
          onSortModelChange={onChangeOrdering}
          filterMode="server"
          onFilterModelChange={onFilterChange}
          // onRowClick={(params) => onClick(params.row)}
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              showColumnsButton: true,
              showDensitySelector: true,
              showFilterButton: true,
              dateRange: dateRange,
              onDateRangeChange: onDateRangeChange
              // tools: [{ label: t("Create"), onClick: onCreate, disabled: !canAdd }]
            }
          }}
        />
      </Paper>
    </Page>
  );
};

export default PaymentsList;
