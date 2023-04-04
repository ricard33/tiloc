import React from "react";
import { useNavigate } from "react-router-dom";
import { useListContractTemplatesQuery } from "../../services/api";
import Page from "../../layouts/Main/Page";

import { Card, CardContent, Tooltip } from "@mui/material";
import { DataGrid, GridColumns, GridRenderCellParams, GridToolbar } from "@mui/x-data-grid";
import { useTranslation } from "react-i18next";
import { ContractTemplate, User } from "../../types";
import ListToolbar from "../../components/ListToolbar";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { formatDistanceToNow } from "../../common/dateUtils";

type Props = {};

const ContractTemplateList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListContractTemplatesQuery();
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_contracttemplate");

  const dateRenderer = (params: GridRenderCellParams<Date>) => {
    const value = params.value ? formatDistanceToNow(params.value) : "-";
    return <Tooltip title={value}><span>{value}</span></Tooltip>;
  };

  const columns = React.useMemo<GridColumns<ContractTemplate>>(
    () => [
      { field: "id", headerName: "ID", width: 50 },
      { field: "name", headerName: t("Name"), flex: 1, minWidth: 100 },
      { field: "created", headerName: t("Created"), flex: 0.5, minWidth: 100, renderCell: dateRenderer },
      { field: "modified", headerName: t("Modified"), flex: 0.5, minWidth: 100, renderCell: dateRenderer }
      // {
      //   field: "actions",
      //   type: "actions",
      //   getActions: (params: GridRowParams) => []
      // }
    ], [t]);

  const onClick = (template: ContractTemplate) => {
    navigate(template.id.toString());
  };

  const onCreate = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar
        title={t("Contract templates")}
        tools={[
          { label: t("Create"), onClick: onCreate, disabled: !canAdd }
        ]}
      />
      <Card sx={{ flex: "1 1 auto", marginTop: "16px" }}>
        <CardContent sx={{ padding: 0, height: "100%" }}>
          <DataGrid
            sx={{
              // flex: "1 1 auto",
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

export default ContractTemplateList;
