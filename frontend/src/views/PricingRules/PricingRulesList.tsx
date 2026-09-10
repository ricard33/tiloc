import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Paper from "@mui/material/Paper";
import Page from "../../layouts/Main/Page";
import GridToolbar from "../../components/GridToolbar";
import { RootState } from "../../store";
import { PricingAdjustment, User } from "../../types";
import { useListLodgingsQuery, useListPricingAdjustmentsQuery } from "../../services/api";

const PricingRulesList: React.FunctionComponent = () => {
  const { t } = useTranslation();
  const { data } = useListPricingAdjustmentsQuery({}, { refetchOnMountOrArgChange: 20 });
  const { data: lodgings } = useListLodgingsQuery();
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_pricingadjustment");

  const lodgingName = (id?: number | null) =>
    id ? (lodgings || []).find(l => l.id === id)?.name ?? `#${id}` : t("All lodgings");

  const columns: GridColDef<PricingAdjustment>[] = [
    { field: "name", headerName: t("Name"), width: 220 },
    {
      field: "lodging", headerName: t("Applies to"), width: 180,
      valueGetter: (params) => lodgingName(params.row.lodging)
    },
    {
      field: "value", headerName: t("Value"), width: 110,
      valueGetter: (params) => `${params.row.value}${params.row.adjustment_type === "percent" ? " %" : " €"}`
    },
    { field: "priority", headerName: t("Priority"), width: 90, type: "number" },
    { field: "stackable", headerName: t("Stackable"), width: 90, type: "boolean" },
    { field: "active", headerName: t("Active"), width: 90, type: "boolean" }
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

export default PricingRulesList;
