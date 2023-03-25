import React from "react";
import { useTranslation } from "react-i18next";
import { useListOwnersQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Owner } from "../../types";
import { DataGrid, GridColDef, GridToolbar, GridValueFormatterParams } from "@mui/x-data-grid";
import { formatPrice } from "../../common/priceUtils";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent } from "@mui/material";

type Props = {};

const OwnersList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListOwnersQuery({}, {refetchOnMountOrArgChange: 20});
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: t("Name"), width: 150 },
    { field: "email", headerName: t("Email"), width: 200 },
    { field: "phone", headerName: t("Phone"), width: 150 },
    { field: "active", headerName: t("Active"), type: "boolean", width: 70 },
  ];

  const onClick = (owner: Owner) => {
    navigate(owner.id.toString());
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar title={t("Owners")} />
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              flex: "1 1 auto",
              minHeight: "300px"
            }}
            rows={data || []}
            columns={columns}
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

export default OwnersList;
