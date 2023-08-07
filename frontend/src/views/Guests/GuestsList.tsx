import React from "react";
import { useTranslation } from "react-i18next";
import { useAllGuestsQuery } from "../../services/api";
import { Guest } from "../../types";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import { Card, CardContent } from "@mui/material";
import GridToolbar from "../../components/GridToolbar";

type Props = {};

const GuestsList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useAllGuestsQuery();
  // const navigate = useNavigate();

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
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              // flex: "1 1 auto",
              minHeight: "300px",
              "&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell": { py: "8px" },
              "&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell": { py: "15px" },
              "&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell": { py: "22px" }
            }}
            rows={data || []}
            getRowId={(row) => row.name}
            columns={columns}
            // getRowHeight={() => 'auto'}
            autoPageSize
            // pageSizeOptions={[5, 10, 20, 50]}
            onRowClick={(params) => onClick(params.row)}
            slots={{
              toolbar: GridToolbar
            }}
            slotProps={{
              toolbar: {
                showColumnsButton: true,
                showDensitySelector: true,
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 }
              }
            }}
          />
        </CardContent>
      </Card>
    </Page>
  );
};

export default GuestsList;
