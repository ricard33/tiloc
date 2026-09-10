import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Page from "../../layouts/Main/Page";
import GridToolbar from "../../components/GridToolbar";
import { RootState } from "../../store";
import { SeasonCalendar, User } from "../../types";
import { useListSeasonCalendarsQuery } from "../../services/api";

const SeasonCalendarList: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const { data } = useListSeasonCalendarsQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_seasoncalendar");

  const columns: GridColDef<SeasonCalendar>[] = [
    { field: "name", headerName: t("Name"), width: 300 },
    {
      field: "seasons",
      headerName: t("Seasons"),
      width: 150,
      valueGetter: (params) => (params.row.seasons || []).length
    },
    {
      field: "lodging_count",
      headerName: t("Lodgings"),
      width: 150
    }
  ];

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Paper sx={{ padding: 0, height: "100%" }}>
        <DataGrid
          sx={{ flex: "1 1 auto", minHeight: "300px" }}
          rows={data || []}
          columns={columns}
          autoPageSize
          onRowClick={(params) => navigate(String(params.row.id))}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showColumnsButton: true,
              showFilterButton: true,
              tools: [{ label: t("Create"), onClick: () => navigate("new"), disabled: !canAdd }]
            }
          }}
        />
      </Paper>
    </Page>
  );
};

export default SeasonCalendarList;
