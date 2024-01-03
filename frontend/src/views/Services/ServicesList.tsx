import React from "react";
import { useTranslation } from "react-i18next";
import { useListServicesQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Service, User } from "../../types";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { formatPrice } from "../../common/priceUtils";
import Page from "../../layouts/Main/Page";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import GridToolbar from "../../components/GridToolbar";
import Paper from "@mui/material/Paper";

type Props = {};

const ServicesList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListServicesQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_service");

  const columns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "designation", headerName: t("Designation"), width: 400 },
    {
      field: "unit_price", headerName: t("Unit price"), type: "number", width: 90,
      valueFormatter: formatPrice
    },
    // {
    //   field: "vat", headerName: t("VAT"), type: "number", width: 90,
    //   valueFormatter: formatPercent
    // },
    { field: "is_flat_rate", headerName: t("Is flat rate?"), type: "boolean", width: 70 }
  ];

  const onClick = (service: Service) => {
    navigate(service.id.toString());
  };

  const onCreateService = () => {
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
          // pageSize={20}
          // pageSizeOptions={[5, 10, 20, 50]}
          onRowClick={(params) => onClick(params.row)}
          slots={{
            toolbar: GridToolbar
          }}
          slotProps={{
            toolbar: {
              showColumnsButton: true,
              showDensitySelector: true,
              showFilterButton: true,
              tools: [{ label: t("Create"), onClick: onCreateService, disabled: !canAdd }]
            }
          }}
        />
      </Paper>
    </Page>
  );
};

export default ServicesList;
