import React from "react";
import { useTranslation } from "react-i18next";
import { useListCalendarSyncsQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { BookingChannel, CalendarSync, Lodging, User } from "../../types";
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar, GridValueFormatterParams } from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent, Tooltip } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { formatDate, formatDistanceToNow } from "../../common/dateUtils";

type Props = {};

const CalendarSyncsList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListCalendarSyncsQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_bookingchannelsync");

  const distanceFormatter = (params: GridValueFormatterParams<Date>) => formatDistanceToNow(params.value);

  const renderDateCell = (params: GridRenderCellParams<any, Date, any>) => (
    <Tooltip title={formatDate(params.value!, "PPpp")}>
      <span className="table-cell-trucate">{formatDistanceToNow(params.value!)}</span>
    </Tooltip>
  );

  const columns = React.useMemo<GridColDef<CalendarSync>[]>(
    () => [
      { field: "id", headerName: "ID", width: 70 },
      {
        field: "lodging", headerName: t("Lodging"), width: 200,
        valueFormatter: (params: GridValueFormatterParams<Partial<Lodging>>) => params.value.name ?? ""
      },
      {
        field: "channel", headerName: t("Booking channel"), width: 200,
        valueFormatter: (params: GridValueFormatterParams<BookingChannel>) => params.value.name ?? ""
      },
      { field: "active", headerName: t("Active ?"), type: "boolean", width: 70 },
      { field: "last_import", headerName: t("Last import"), width: 200, valueFormatter: distanceFormatter,
        renderCell: renderDateCell
      },
      { field: "last_export", headerName: t("Last export"), width: 200, valueFormatter: distanceFormatter,
        renderCell: renderDateCell
      },
    ], [t]);

  const onClick = (calendarSync: CalendarSync) => {
    navigate(calendarSync.id.toString());
  };

  const onCreateCalendarSync = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar
        title={t("Calendars synchronization")}
        tools={[
          { label: t("Create"), onClick: onCreateCalendarSync, disabled: !canAdd }
        ]}
      />
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              flex: "1 1 auto",
              minHeight: "300px"
            }}
            rows={data || []}
            columns={columns}
            autoPageSize
            // pageSize={20}
            // pageSizeOptions={[5, 10, 20, 50]}
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

export default CalendarSyncsList;
