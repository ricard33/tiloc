import React from "react";
import { useTranslation } from "react-i18next";
import {
  useListBookingStatusesQuery,
  useMoveDownBookingStatusMutation,
  useMoveUpBookingStatusMutation
} from "../../services/api";
import { useNavigate } from "react-router-dom";
import { BookingStatus } from "../../types";
import {
  DataGrid,
  GridActionsCellItem,
  GridColumns,
  GridRenderCellParams,
  GridRowParams,
  GridToolbar
} from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent } from "@mui/material";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";

type Props = {};

const BookingStatusesList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data, refetch: refetchStatuses } = useListBookingStatusesQuery({}, { refetchOnMountOrArgChange: 20 });
  const [moveUp] = useMoveUpBookingStatusMutation();
  const [moveDown] = useMoveDownBookingStatusMutation();
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();

  const onRankUpDown = React.useCallback((status: BookingStatus, direction: "up" | "down") => {
    const action = direction === "up" ? moveUp : moveDown;
    action({ statusId: status.id }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error(`Error moving ${direction} booking status`, error);
        showError(t(`Impossible to move ${direction} booking status: `) + fetchErrorDecode(error));
      } else {
        refetchStatuses();
        showSuccess(t(`Status moved ${direction}`));
      }
    });
  }, [moveDown, moveUp, refetchStatuses, showError, showSuccess, t]);

  const columns = React.useMemo<GridColumns<BookingStatus>>(
    () => [
      { field: "id", headerName: "ID", width: 70, sortable: false },
      { field: "name", headerName: t("Name"), width: 150, sortable: false },
      {
        field: "color", headerName: t("Color"), width: 100, sortable: false,
        renderCell: (params: GridRenderCellParams<string>) => (
          <div
            style={{ marginLeft: 16, width: "6em", height: "1em", backgroundColor: params.value }}
          >
            &nbsp;
          </div>
        )
      },
      { field: "no_stats", headerName: t("No statistics"), width: 100, type: "boolean" },
      { field: "finalized", headerName: t("Final state"), width: 100, type: "boolean" },
      {
        field: "actions",
        type: "actions",
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem icon={<ArrowUpwardIcon />} onClick={() => onRankUpDown(params.row, "up")} label="up" />,
          <GridActionsCellItem
            icon={<ArrowDownwardIcon />} onClick={() => onRankUpDown(params.row, "down")} label="down"
            // showInMenu
          />
        ]
      }
    ], [onRankUpDown, t]);

  const onClick = (bookingStatus: BookingStatus) => {
    navigate(bookingStatus.id.toString());
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar title={t("Booking status")} />
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              flex: "1 1 auto",
              minHeight: "300px"
            }}
            rows={data || []}
            columns={columns}
            disableColumnFilter
            pageSize={20}
            rowsPerPageOptions={[5, 10, 20, 50]}
            onRowClick={(params) => onClick(params.row)}
            components={{
              Toolbar: GridToolbar
            }}
          />
        </CardContent>
      </Card>
    </Page>
  );
};

export default BookingStatusesList;
