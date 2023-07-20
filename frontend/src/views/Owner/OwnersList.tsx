import React from "react";
import { useTranslation } from "react-i18next";
import { useListOwnersQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Owner, User } from "../../types";
import { DataGrid, GridColDef, GridToolbar } from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

type Props = {};

const OwnersList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListOwnersQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_owner");

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: t("Name"), width: 150 },
    { field: "email", headerName: t("Email"), width: 200 },
    { field: "phone", headerName: t("Phone"), width: 150 },
    { field: "active", headerName: t("Active"), type: "boolean", width: 70 }
  ];

  const onClick = (owner: Owner) => {
    navigate(owner.id.toString());
  };

  const onCreateOwner = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar
        title={t("Owners")}
        tools={[
          { label: t("Create"), onClick: onCreateOwner, disabled: !canAdd }
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
            slots={{
              toolbar: GridToolbar
            }}
          />
        </CardContent>
      </Card>
    </Page>
  );
};

export default OwnersList;
