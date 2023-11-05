import React from "react";
import { useTranslation } from "react-i18next";
import {
  useListLodgingsQuery,
  useListUsersQuery,
  useMoveDownLodgingMutation,
  useMoveUpLodgingMutation
} from "../../services/api";
import { useNavigate } from "react-router-dom";
import { Lodging, User } from "../../types";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRowParams,
  GridValueFormatterParams,
  GridValueGetterParams
} from "@mui/x-data-grid";
import { formatPrice } from "../../common/priceUtils";
import Page from "../../layouts/Main/Page";
import { Card, CardContent } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { fetchErrorDecode } from "../../common/apiUtils";
import { useAlert } from "../../common/alertUtils";
import GridToolbar from "../../components/GridToolbar";

type Props = {};

const LodgingsList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data, refetch } = useListLodgingsQuery({}, {refetchOnMountOrArgChange: 20});
  const { data: users } = useListUsersQuery();
  const [moveUp] = useMoveUpLodgingMutation();
  const [moveDown] = useMoveDownLodgingMutation();
  const navigate = useNavigate();
  const { showError, showSuccess } = useAlert();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_lodging");
  const canChange = user.permissions.includes("core.change_lodging");

  const onRankUpDown = React.useCallback((lodging: Lodging, direction: "up" | "down") => {
    const action = direction === "up" ? moveUp : moveDown;
    action({ lodgingId: lodging.id }).then((result) => {
      if ((result as any).error) {
        const error = (result as any).error;
        console.error(`Error moving ${direction} lodging`, error);
        showError(t(`Impossible to move ${direction} lodging: `) + fetchErrorDecode(error));
      } else {
        refetch();
        showSuccess(t(`Lodging moved ${direction}`));
      }
    });
  }, [moveDown, moveUp, refetch, showError, showSuccess, t]);

  const columns = React.useMemo<GridColDef[]>(
    () => [
      // { field: "id", headerName: "ID", width: 70 },
      { field: "name", headerName: t("Name"), width: 130 },
      {
        field: "owner", headerName: t("Owner"), width: 130,
        type: "singleSelect",
        valueGetter: (params: GridValueGetterParams<Partial<User>>) => {
          return { ...params.value, value: params.value.id };
        },
        valueFormatter: (params: GridValueFormatterParams<Partial<User>>) => {
          return params.value.full_name;
        },
        valueOptions: users && [...users.map((u) => {
          return { value: u.id, label: u.full_name };
        })]
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
        field: "max_daily_tourist_tax", headerName: t("Tourist tax"), type: "number", width: 90,
        valueFormatter: formatPrice
      },
      {
        field: "actions",
        type: "actions",
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem disabled={!canChange} icon={<ArrowUpwardIcon />} onClick={() => onRankUpDown(params.row, "up")} label="up" />,
          <GridActionsCellItem
            disabled={!canChange}
            icon={<ArrowDownwardIcon />} onClick={() => onRankUpDown(params.row, "down")} label="down"
            // showInMenu
          />
        ]
      }
    ], [canChange, onRankUpDown, users, t]);

  const onClick = (lodging: Lodging) => {
    navigate(lodging.id.toString());
  };

  const onCreate = () => {
    navigate("new");
  };

  return (
    <Page sx={{ display: "flex", flexFlow: "column" }}>
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
            onRowClick={(params) => onClick(params.row)}
            slots={{
              toolbar: GridToolbar
            }}
            slotProps={{
              toolbar: {
                showColumnsButton: true,
                showDensitySelector: true,
                showFilterButton: true,
                tools: [{ label: t("Create"), onClick: onCreate, disabled: !canAdd }]
              }
            }}
          />
        </CardContent>
      </Card>
    </Page>
  );
};

export default LodgingsList;
