import React from "react";
import { useTranslation } from "react-i18next";
import { useListUsersQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { User } from "../../types";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import GridToolbar from "../../components/GridToolbar";
import Paper from "@mui/material/Paper";

type Props = {};

const UsersList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListUsersQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>((store) => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_user");

  const columns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "first_name", headerName: t("First name"), width: 150 },
    { field: "last_name", headerName: t("Last name"), width: 150 },
    { field: "email", headerName: t("Email"), width: 200 },
    {
      field: "groups", headerName: t("User type"), width: 200,
      valueFormatter: (params) => t(params.value)
    },
    { field: "is_active", headerName: t("Active"), type: "boolean", width: 70 }
  ];

  const onClick = (user: User) => {
    navigate(user.id.toString());
  };

  const onCreateUser = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <Paper sx={{ padding: 0, height: "100%" }}>
        <DataGrid
          sx={{
            flex: "1 1 auto",
            minHeight: "300px"
          }}
          rows={data || []}
          columns={columns}
          autoPageSize
          onRowClick={(params) => onClick(params.row)}
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              showColumnsButton: true,
              showDensitySelector: true,
              showFilterButton: true,
              tools: [{ label: t("Create"), onClick: onCreateUser, disabled: !canAdd }]
            }
          }}
        />
      </Paper>
    </Page>
  );
};

export default UsersList;
