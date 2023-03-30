import React from "react";
import { useTranslation } from "react-i18next";
import { useListLodgingsQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Lodging, Owner, User } from "../../types";
import { DataGrid, GridColDef, GridToolbar, GridValueFormatterParams } from "@mui/x-data-grid";
import { formatPrice } from "../../common/priceUtils";
import Page from "../../layouts/Main/Page";
import ListToolbar from "../../components/ListToolbar";
import { Card, CardContent } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

type Props = {};

const LodgingsList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListLodgingsQuery({}, {refetchOnMountOrArgChange: 20});
  // const { data: owners } = useListOwnersQuery();
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_lodging");

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: t("Name"), width: 130 },
    {
      field: "owner", headerName: t("Owner"), width: 130,
      valueFormatter: (params: GridValueFormatterParams<Partial<Owner>>) => params.value.name ?? ""
      // valueFormatter: (params: GridValueFormatterParams<number>) => getOwnerName(params.value) ?? ""
    },
    { field: "active", headerName: t("Active"), type: "boolean", width: 70 },
    { field: "shown", headerName: t("Shown"), type: "boolean", width: 70 },
    {
      field: "daily_rate", headerName: t("Daily rate"), type: "number", width: 90,
      valueFormatter: formatPrice
    },
    {
      field: "guaranty", headerName: t("Guaranty"), type: "number", width: 90,
      valueFormatter: formatPrice
    },
    { field: "capacity", headerName: t("Capacity"), type: "number", width: 90 },
    {
      field: "tourist_tax", headerName: t("Tourist tax"), type: "number", width: 90,
      valueFormatter: formatPrice
    }
  ];

  // const getOwnerName = (ownerId: number) => {
  //   if (owners) {
  //     const owner = owners.find(o => o.id === ownerId);
  //     return owner ? owner.name : "";
  //   }
  // };

  const onClick = (lodging: Lodging) => {
    navigate(lodging.id.toString());
  };

  const onCreate = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
      <ListToolbar
        title={t("Lodgings")}
        tools={[
          { label: t("Create"), onClick: onCreate, disabled: !canAdd }
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

export default LodgingsList;
