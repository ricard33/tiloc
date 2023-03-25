import React from "react";
import { useTranslation } from "react-i18next";
import { useAllGuestsQuery, useListServicesQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Guest, Service } from "../../types";
import { DataGrid, GridColDef, GridToolbar, GridValueFormatterParams } from "@mui/x-data-grid";
import { formatPercent, formatPrice } from "../../common/priceUtils";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent } from "@mui/material";

type Props = {};

const GuestsList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useAllGuestsQuery();
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: t("Name"), width: 400 },
    { field: "contact", headerName: t("Contact"), width: 200 },
    { field: "address", headerName: t("Address"), width: 200 },
  ];

  const onClick = (guest: Guest) => {
    // navigate(guest.id.toString());
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar title={t("Guests")} />
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              flex: "1 1 auto",
              minHeight: "300px",
              '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': { py: '8px' },
              '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': { py: '15px' },
              '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': { py: '22px' },
            }}
            rows={data || []}
            getRowId={row => row.name}
            columns={columns}
            getRowHeight={() => 'auto'}
            rowsPerPageOptions={[5, 10, 20, 50]}
            onRowClick={(params) => onClick(params.row)}
            components={{
              Toolbar: GridToolbar
            }}
            componentsProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
          />
        </CardContent>
      </Card>
    </Page>
  );
};

export default GuestsList;
