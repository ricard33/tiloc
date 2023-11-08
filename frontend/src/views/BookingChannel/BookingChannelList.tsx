import React from "react";
import { useTranslation } from "react-i18next";
import { useListBookingChannelsQuery } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { BookingChannel, User } from "../../types";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import Page from "../../layouts/Main/Page";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import GridToolbar from "../../components/GridToolbar";
import Paper from "@mui/material/Paper";

type Props = {};

const BookingChannelList: React.FunctionComponent<Props> = () => {
  const { t } = useTranslation();
  const { data } = useListBookingChannelsQuery({}, { refetchOnMountOrArgChange: 20 });
  const navigate = useNavigate();
  const user = useSelector<RootState>(store => store.auth.user) as User;
  const canAdd = user.permissions.includes("core.add_bookingchannel");

  const columns: GridColDef[] = [
    // { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: t("Name"), width: 400 }
  ];

  const onClick = (bookingChannel: BookingChannel) => {
    navigate(bookingChannel.id.toString());
  };

  const onCreateBookingChannel = () => {
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
              tools: [{ label: t("Create"), onClick: onCreateBookingChannel, disabled: !canAdd }]
            }
          }}
        />
      </Paper>
    </Page>
  );
};

export default BookingChannelList;
